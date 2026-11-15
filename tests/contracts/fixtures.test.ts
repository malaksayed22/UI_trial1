import { describe, expect, it } from "vitest";
import {
  gateRuns,
  gateSummaries,
  investigations,
  overviewSummary,
  ragDiagnostics,
  traceDetails,
  traceSummaries,
} from "@/mocks/fixtures";
import { failureLabelText, rootCauseText } from "@/lib/labels";

/**
 * Contract checks: the fixtures must stay internally consistent so the UI can
 * trust deep links, ordering and provenance exactly as the live API will.
 */

describe("trace fixtures", () => {
  it("keeps list summaries identical to the detail summaries", () => {
    Object.values(traceDetails).forEach(detail => {
      expect(traceSummaries).toContainEqual(detail.summary);
    });
  });

  it("orders events by sequence and links parents that exist", () => {
    Object.values(traceDetails).forEach(detail => {
      const ids = new Set(detail.events.map(event => event.eventId));
      const sequences = detail.events.map(event => event.sequence);
      expect(sequences).toEqual([...sequences].sort((a, b) => a - b));
      detail.events.forEach(event => {
        if (event.parentId) expect(ids.has(event.parentId)).toBe(true);
      });
    });
  });

  it("resolves every evidence link to an event on the same trace", () => {
    Object.entries(traceDetails).forEach(([traceId, detail]) => {
      const ids = new Set(detail.events.map(event => event.eventId));
      const investigation = investigations[traceId];
      const links = [
        ...detail.evaluators.flatMap(item => item.evidenceEventIds),
        ...detail.policyFindings.flatMap(item => item.evidenceEventIds),
        ...(investigation?.rca.flatMap(item => item.evidenceEventIds) ?? []),
      ];
      links.forEach(id => expect(ids.has(id), `${traceId}: ${id}`).toBe(true));
    });
  });

  it("only references graph nodes and events that exist", () => {
    Object.values(traceDetails).forEach(detail => {
      const eventIds = new Set(detail.events.map(event => event.eventId));
      const nodeIds = new Set(detail.graph.nodes.map(node => node.nodeId));
      detail.graph.nodes.forEach(node => {
        if (node.eventId) expect(eventIds.has(node.eventId)).toBe(true);
        else expect(node.state).toBe("missing");
      });
      detail.graph.edges.forEach(edge => {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      });
    });
  });

  it("never lets a blocked proposal look like an executed tool", () => {
    const bypass = traceDetails["trace-8f21c9a4"];
    const results = bypass?.events.filter(event => event.type === "tool_result") ?? [];
    expect(results.map(event => event.type === "tool_result" && event.outcome)).toEqual([
      "blocked",
    ]);
    expect(bypass?.graph.nodes.some(node => node.state === "missing")).toBe(true);
  });

  it("uses only labels from the known taxonomy", () => {
    traceSummaries.forEach(trace => {
      expect(failureLabelText[trace.failureLabel]).toBeDefined();
    });
  });
});

describe("investigation fixtures", () => {
  it("lists RCA causes in rank order with descending evidence scores", () => {
    Object.values(investigations).forEach(investigation => {
      investigation.rca.forEach((cause, index) => {
        expect(cause.rank).toBe(index + 1);
        expect(rootCauseText[cause.causeId]).toBeDefined();
        const next = investigation.rca[index + 1];
        if (next) expect(cause.evidenceScore).toBeGreaterThanOrEqual(next.evidenceScore);
      });
      expect(investigation.rca.length).toBeLessThanOrEqual(3);
    });
  });

  it("ends every decision path with the machine decision", () => {
    Object.values(investigations).forEach(investigation => {
      const last = investigation.decisionPath.at(-1);
      expect(last).toMatchObject({ kind: "verdict", decision: investigation.decision });
    });
  });

  it("matches the decision shown in the trace list", () => {
    Object.entries(investigations).forEach(([traceId, investigation]) => {
      const summary = traceSummaries.find(trace => trace.traceId === traceId);
      expect(investigation.decision).toBe(summary?.decision);
    });
  });
});

describe("rag fixtures", () => {
  it("only exists for traces that declare a RAG view", () => {
    Object.keys(ragDiagnostics).forEach(traceId => {
      expect(traceDetails[traceId]?.availableViews.rag).toBe(true);
    });
  });

  it("declares a RAG view only for traces that have diagnostics", () => {
    Object.entries(traceDetails).forEach(([traceId, detail]) => {
      expect(Boolean(ragDiagnostics[traceId]), traceId).toBe(detail.availableViews.rag);
    });
  });

  it("anchors every claim at exact offsets in the answer", () => {
    Object.values(ragDiagnostics).forEach(({ answer, claims, traceId }) => {
      const ordered = [...claims].sort((a, b) => a.answerSpan.start - b.answerSpan.start);
      ordered.forEach((claim, index) => {
        expect(answer, traceId).not.toBeNull();
        expect(answer!.slice(claim.answerSpan.start, claim.answerSpan.end), claim.claimId).toBe(
          claim.text
        );
        const next = ordered[index + 1];
        if (next) expect(claim.answerSpan.end).toBeLessThanOrEqual(next.answerSpan.start);
      });
    });
  });

  it("resolves every citation to a source, version, passage and span that exist", () => {
    Object.values(ragDiagnostics).forEach(({ claims, sources, documents, traceId }) => {
      claims.forEach(claim => {
        const { citation } = claim;
        if (!citation) return;
        const where = `${traceId}:${claim.claimId}`;
        const source = sources.find(
          item => item.sourceId === citation.sourceId && item.version === citation.documentVersion
        );
        expect(source, where).toBeDefined();
        const passage = source?.passages.find(item => item.passageId === citation.passageId);
        expect(passage, where).toBeDefined();
        if (citation.sourceSpan && passage) {
          expect(citation.sourceSpan.start, where).toBeGreaterThanOrEqual(0);
          expect(citation.sourceSpan.end, where).toBeLessThanOrEqual(passage.text.length);
        }
        const retrieved = documents.find(item => item.documentId === citation.sourceId);
        expect(retrieved?.version, where).toBe(citation.documentVersion);
      });
    });
  });

  it("gives a span to supported claims and none to unsupported ones", () => {
    Object.values(ragDiagnostics).forEach(({ claims }) => {
      claims.forEach(claim => {
        if (claim.status === "supported") {
          expect(claim.citation?.sourceSpan, claim.claimId).not.toBeNull();
          expect(claim.reason).toBeNull();
        } else {
          expect(claim.citation?.sourceSpan ?? null, claim.claimId).toBeNull();
          expect(claim.reason, claim.claimId).toEqual(expect.any(String));
        }
      });
    });
  });

  it("keeps abstention and technical failure apart", () => {
    const abstained = ragDiagnostics["trace-e5a7c302"]!;
    expect(abstained.outcome.kind).toBe("abstained");
    expect(abstained.claims).toEqual([]);
    expect(abstained.failureMode).toBe("none");
    expect(traceSummaries.find(t => t.traceId === abstained.traceId)?.decision).toBe("PASS");

    const failed = ragDiagnostics["trace-f9b1d7a4"]!;
    expect(failed.outcome.kind).toBe("technical_failure");
    expect(failed.answer).toBeNull();
    expect(failed.failureMode).toBe("technical_failure");
    expect(traceSummaries.find(t => t.traceId === failed.traceId)?.decision).not.toBe("PASS");
    Object.values(failed.metrics).forEach(metric => {
      expect(metric.status).toBe("not_evaluated");
    });
    const retrieval = traceDetails[failed.traceId]!.events.find(e => e.type === "retrieval");
    expect(retrieval?.type === "retrieval" && retrieval.failure).toBeTruthy();
  });

  it("separates a failed retrieval from one that found nothing", () => {
    Object.values(traceDetails).forEach(detail => {
      detail.events.forEach(event => {
        if (event.type === "retrieval" && event.failure) {
          expect(event.documents).toEqual([]);
        }
      });
    });
  });
});

describe("action fixtures", () => {
  const details = Object.entries(traceDetails);

  it("links every action to events of the right type on the same trace", () => {
    details.forEach(([traceId, detail]) => {
      const byId = new Map(detail.events.map(event => [event.eventId, event]));
      detail.actions.forEach(action => {
        expect(byId.get(action.proposal.eventId)?.type, traceId).toBe("tool_call");
        if (action.invocation.eventId) {
          expect(byId.get(action.invocation.eventId)?.type, traceId).toBe("tool_result");
        }
        action.effect.evidenceEventIds.forEach(id => expect(byId.has(id), traceId).toBe(true));
      });
      detail.events.forEach(event => {
        if (event.type === "tool_call" || event.type === "tool_result") {
          expect(detail.actions.some(a => a.actionId === event.actionId), traceId).toBe(true);
        }
      });
    });
  });

  it("never reports an effect for an action that was never dispatched", () => {
    details.forEach(([traceId, detail]) => {
      detail.actions
        .filter(action => action.invocation.status === "suppressed")
        .forEach(action => expect(action.effect.status, traceId).toBe("no_effect"));
    });
  });

  it("never turns an unconfirmed invocation into a known outcome", () => {
    details.forEach(([traceId, detail]) => {
      detail.actions.forEach(action => {
        if (action.invocation.status === "invoked" && action.invocation.result === "unconfirmed") {
          expect(action.effect.status, traceId).toBe("unknown");
        }
      });
    });
  });

  it("matches the execution status to what the actions record", () => {
    details.forEach(([traceId, detail]) => {
      const invocations = detail.actions.map(action => action.invocation);
      const expected = (() => {
        if (invocations.length === 0) return "not_applicable";
        if (invocations.some(i => i.status === "invoked" && i.result === "unconfirmed")) {
          return "outcome_unknown";
        }
        if (invocations.some(i => i.status === "invoked" && i.result === "failed")) return "failed";
        if (invocations.some(i => i.status === "invoked")) return "executed";
        return "not_executed";
      })();
      expect(detail.status.execution.status, traceId).toBe(expected);
    });
  });

  it("only authorizes an action that has an approved record", () => {
    details.forEach(([traceId, detail]) => {
      detail.actions.forEach(action => {
        if (action.authorization.status !== "authorized") return;
        const approved = action.authorization.approvalIds.some(
          id => detail.approvals.find(a => a.approvalId === id)?.status === "approved"
        );
        expect(approved, traceId).toBe(true);
      });
    });
  });

  it("links approvals and actions both ways", () => {
    details.forEach(([traceId, detail]) => {
      const approvalIds = new Set(detail.approvals.map(a => a.approvalId));
      const actionIds = new Set(detail.actions.map(a => a.actionId));
      detail.actions.forEach(action =>
        action.authorization.approvalIds.forEach(id => expect(approvalIds.has(id), traceId).toBe(true))
      );
      detail.approvals.forEach(approval => {
        approval.actionIds.forEach(id => expect(actionIds.has(id), traceId).toBe(true));
        if (approval.status === "pending") {
          expect(approval.decidedAt).toBeNull();
          expect(approval.decidedBy).toBeNull();
        } else {
          expect(approval.decidedAt, traceId).not.toBeNull();
        }
      });
    });
  });

  it("covers every approval status and every side-effect kind", () => {
    const approvals = details.flatMap(([, d]) => d.approvals.map(a => a.status));
    expect(new Set(approvals)).toEqual(new Set(["pending", "approved", "denied", "cancelled"]));

    const effects = details.flatMap(([, d]) =>
      d.actions.map(a =>
        a.effect.status === "known_effect" ? `known:${a.effect.origin.kind}` : a.effect.status
      )
    );
    expect(new Set(effects)).toEqual(
      new Set(["known:created", "known:recovered", "no_effect", "unknown"])
    );
  });

  it("marks a recovered result with the original creation time", () => {
    const recovered = traceDetails["trace-b7d2e4c1"]!.actions[0]!.effect;
    const created = traceDetails["trace-9a03e771"]!.actions[0]!.effect;
    if (recovered.status !== "known_effect" || created.status !== "known_effect") {
      throw new Error("expected known effects");
    }
    expect(recovered.origin.kind).toBe("recovered");
    expect(created.origin.kind).toBe("created");
    expect(recovered.resource.id).toBe(created.resource.id);
    if (recovered.origin.kind === "recovered" && created.origin.kind === "created") {
      expect(recovered.origin.originallyCreatedAt).toBe(created.origin.createdAt);
    }
  });
});

describe("response delivery fixtures", () => {
  const details = Object.entries(traceDetails);

  it("gates the candidate at a final_response event whose text is the delivered text", () => {
    details.forEach(([traceId, detail]) => {
      const event = detail.events.find(e => e.eventId === detail.delivery.eventId);
      expect(event?.type, traceId).toBe("final_response");
      expect(event?.type === "final_response" && event.text, traceId).toBe(
        detail.delivery.delivered.text
      );
    });
  });

  it("agrees the disposition with the candidate, the delivery and the interventions", () => {
    details.forEach(([traceId, detail]) => {
      const { disposition, rawCandidate, delivered, interventions } = detail.delivery;
      if (disposition === "unchanged") {
        expect(rawCandidate?.text, traceId).toBe(delivered.text);
        expect(interventions, traceId).toEqual([]);
      } else if (disposition === "no_candidate") {
        expect(rawCandidate, traceId).toBeNull();
      } else {
        expect(rawCandidate?.text, traceId).not.toBe(delivered.text);
        expect(interventions.length, traceId).toBeGreaterThan(0);
      }
    });
  });

  it("references only recorded actions", () => {
    details.forEach(([traceId, detail]) => {
      const ids = new Set(detail.actions.map(a => a.actionId));
      const refs = [
        ...(detail.delivery.rawCandidate?.actionRefs ?? []),
        ...detail.delivery.delivered.actionRefs,
      ];
      refs.forEach(ref => expect(ids.has(ref.actionId), traceId).toBe(true));
    });
  });

  it("never lets a suppressed action support a completion claim", () => {
    details.forEach(([traceId, detail]) => {
      const suppressed = new Set(
        detail.actions.filter(a => a.invocation.status === "suppressed").map(a => a.actionId)
      );
      detail.delivery.delivered.actionRefs
        .filter(ref => suppressed.has(ref.actionId) && ref.consistency === "consistent")
        .forEach(ref => expect(ref.claim.toLowerCase(), traceId).toMatch(/no |not /));
    });
  });

  it("shows a delivered contradiction as such, and a correction as a different state", () => {
    const bypass = traceDetails["trace-8f21c9a4"]!.delivery;
    expect(bypass.disposition).toBe("unchanged");
    expect(bypass.delivered.actionRefs[0]?.consistency).toBe("contradicted");

    const denied = traceDetails["trace-d41f6b27"]!.delivery;
    expect(denied.disposition).toBe("corrected");
    expect(denied.rawCandidate?.actionRefs[0]?.consistency).toBe("contradicted");
    expect(denied.delivered.actionRefs[0]?.consistency).toBe("consistent");
  });
});

describe("status fixtures", () => {
  it("lets a trace be blocked at the gate yet carry a corrected response", () => {
    const denied = traceDetails["trace-d41f6b27"]!;
    expect(denied.status.policy.stage).toBe("gate_blocked");
    expect(denied.status.execution.status).toBe("not_executed");
    expect(denied.summary.decision).toBe("BLOCK");
    expect(denied.delivery.disposition).toBe("corrected");
  });

  it("lets an authorized action go undispatched without a policy failure", () => {
    const detail = traceDetails["trace-a8c63e15"]!;
    const action = detail.actions[0]!;
    expect(action.authorization.status).toBe("authorized");
    expect(action.invocation.status).toBe("suppressed");
    expect(action.effect.status).toBe("no_effect");
    expect(detail.status.policy.stage).toBe("gate_passed");
    expect(detail.status.execution.status).toBe("not_executed");
    expect(detail.summary.policySecurityVerdict).toBe("PASS");
    expect(detail.summary.decision).toBe("REVIEW");
  });

  it("lets a passed policy gate sit beside an unknown outcome", () => {
    const unknown = traceDetails["trace-c35e8a90"]!;
    expect(unknown.status.policy.stage).toBe("gate_passed");
    expect(unknown.status.execution.status).toBe("outcome_unknown");
    expect(unknown.summary.decision).toBe("REVIEW");
  });

  it("never pairs UNAVAILABLE with PASS and always explains it with a failed evaluator", () => {
    traceSummaries
      .filter(trace => trace.policySecurityVerdict === "UNAVAILABLE")
      .forEach(trace => {
        expect(trace.decision).not.toBe("PASS");
        const failed = traceDetails[trace.traceId]?.evaluators.some(
          evaluator => evaluator.outcome.status === "evaluator_failed"
        );
        expect(failed, trace.traceId).toBe(true);
      });
  });
});

describe("release gate fixtures", () => {
  it("reports deltas that equal candidate minus baseline", () => {
    gateRuns.forEach(run => {
      run.metrics.forEach(metric => {
        const expected = Math.round((metric.candidate - metric.baseline) * 100) / 100;
        expect(metric.delta).toBeCloseTo(expected, 2);
      });
    });
  });

  it("agrees with the summary list on verdict and run id", () => {
    gateRuns.forEach(run => {
      const summary = gateSummaries.find(item => item.runId === run.runId);
      expect(summary?.verdict).toBe(run.verdict);
    });
  });

  it("never reports PASS for an incomplete run", () => {
    gateRuns
      .filter(run => run.status !== "complete")
      .forEach(run => expect(run.verdict).not.toBe("PASS"));
  });

  it("evaluates baseline and candidate on one dataset", () => {
    gateRuns.forEach(run => {
      expect(run.datasetVersion).toMatch(/^dataset-v/);
      expect(run.evaluatorSetVersion).toMatch(/^evalset-v/);
    });
  });
});

describe("overview fixture", () => {
  it("has decision counts that add up to the trace count", () => {
    const { PASS, REVIEW, BLOCK } = overviewSummary.distribution;
    expect(PASS + REVIEW + BLOCK).toBe(overviewSummary.traceCount);
  });

  it("reconciles failure classes with traces that need investigation", () => {
    const { REVIEW, BLOCK } = overviewSummary.distribution;
    const classified = overviewSummary.failureClasses.reduce((sum, item) => sum + item.count, 0);
    expect(classified).toBe(REVIEW + BLOCK);
  });

  it("reconciles per-application counts with the overall totals", () => {
    const apps = overviewSummary.applications;
    expect(apps.reduce((sum, app) => sum + app.traceCount, 0)).toBe(overviewSummary.traceCount);
    (["PASS", "REVIEW", "BLOCK"] as const).forEach(key => {
      expect(apps.reduce((sum, app) => sum + app.distribution[key], 0)).toBe(
        overviewSummary.distribution[key]
      );
    });
  });
});

describe("stage and gate fixtures (TRD-22, TRD-23, policy gate)", () => {
  const details = Object.values(traceDetails);

  it("points every state transition at an event that exists", () => {
    details.forEach(detail => {
      const ids = new Set(detail.events.map(event => event.eventId));
      (detail.stateTransitions ?? []).forEach(transition => {
        expect(ids.has(transition.eventId)).toBe(true);
      });
    });
  });

  it("carries transitions and boundary stages on the approval-flow traces", () => {
    ["trace-8f21c9a4", "trace-9a03e771", "trace-a8c63e15"].forEach(id => {
      const detail = traceDetails[id]!;
      expect(detail.stateTransitions?.length).toBeGreaterThan(0);
      expect(detail.actions.every(action => action.stageAtBoundaries)).toBe(true);
    });
  });

  it("has no dispatch stage for an action that was suppressed", () => {
    details.forEach(detail => {
      detail.actions.forEach(action => {
        if (action.invocation.status === "suppressed" && action.stageAtBoundaries) {
          expect(action.stageAtBoundaries.policyStageAtDispatch).toBeNull();
        }
        if (action.invocation.status === "invoked" && action.stageAtBoundaries) {
          expect(action.stageAtBoundaries.policyStageAtDispatch).not.toBeNull();
        }
      });
    });
  });

  it("reports an attempted transition for the undispatched and the unapproved action", () => {
    ["trace-8f21c9a4", "trace-a8c63e15"].forEach(id => {
      const dispositions = traceDetails[id]!.stateTransitions!.map(item => item.disposition);
      expect(dispositions).toContain("attempted");
    });
    const accepted = traceDetails["trace-9a03e771"]!.stateTransitions!;
    expect(accepted.every(item => item.disposition === "accepted")).toBe(true);
  });

  it("keeps each evaluated policy result equal to the matching policy finding", () => {
    details.forEach(detail => {
      detail.status.policy.gate?.evaluatedPolicies.forEach(policy => {
        const finding = detail.policyFindings.find(item => item.policyId === policy.policyId);
        expect(finding?.outcome).toBe(policy.policyResult);
      });
    });
  });
});
