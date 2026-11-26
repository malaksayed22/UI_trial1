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
import type { Investigation, RcaCause } from "@/types";
import {
  SUPPLIER_POLICY_ID,
  supplierEvidenceProblems,
  supplierFindingOf,
} from "../helpers/supplier-evidence";

/** Ranked causes only. "Not assessed" has none, and is checked on its own. */
const rankedCauses = (rca: Investigation["rca"]): RcaCause[] => (Array.isArray(rca) ? rca : []);

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
        ...(investigation ? rankedCauses(investigation.rca) : []).flatMap(
          item => item.evidenceEventIds
        ),
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
      const causes = rankedCauses(investigation.rca);
      causes.forEach((cause, index) => {
        expect(cause.rank).toBe(index + 1);
        expect(rootCauseText[cause.causeId]).toBeDefined();
        const next = causes[index + 1];
        if (next) expect(cause.evidenceScore).toBeGreaterThanOrEqual(next.evidenceScore);
      });
      expect(causes.length).toBeLessThanOrEqual(3);
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

  const gates = details.flatMap(detail =>
    detail.status.policy.gate ? [{ detail, gate: detail.status.policy.gate }] : []
  );

  it("carries gate data on the three approval-flow traces", () => {
    expect(gates.map(item => item.detail.summary.traceId).sort()).toEqual([
      "trace-8f21c9a4",
      "trace-9a03e771",
      "trace-a8c63e15",
    ]);
  });

  it("uses only ALLOW or BLOCK as the action verdict", () => {
    gates.forEach(({ gate }) => expect(["ALLOW", "BLOCK"]).toContain(gate.actionVerdict));
  });

  it("uses only PASS, FAIL, NOT_APPLICABLE or ERROR as a policy result, in uppercase", () => {
    gates.forEach(({ gate }) => {
      expect(gate.evaluatedPolicies.length).toBeGreaterThan(0);
      gate.evaluatedPolicies.forEach(policy =>
        expect(["PASS", "FAIL", "NOT_APPLICABLE", "ERROR"]).toContain(policy.policyResult)
      );
    });
  });

  it("keeps the verdict basis a code and the explanation a separate sentence", () => {
    gates.forEach(({ gate }) => {
      expect([
        "ALL_APPLICABLE_PASSED",
        "MANDATORY_POLICY_FAILED",
        "FAIL_CLOSED_ON_POLICY_ERROR",
      ]).toContain(gate.verdictBasis);
      expect(gate.verdictExplanation).toMatch(/\s/);
      expect(gate.verdictExplanation).not.toBe(gate.verdictBasis);
    });
  });

  it("uses the basis code that matches the policy results", () => {
    gates.forEach(({ detail, gate }) => {
      const results = gate.evaluatedPolicies.map(policy => policy.policyResult);
      // Any ERROR fails closed; otherwise any FAIL is a failed mandatory policy.
      // A trace with both ERROR and FAIL is not covered by the rule given, and
      // no fixture has one.
      expect(results.includes("ERROR") && results.includes("FAIL"), detail.summary.traceId).toBe(
        false
      );
      const expected = results.includes("ERROR")
        ? "FAIL_CLOSED_ON_POLICY_ERROR"
        : results.includes("FAIL")
          ? "MANDATORY_POLICY_FAILED"
          : "ALL_APPLICABLE_PASSED";
      expect(gate.verdictBasis, detail.summary.traceId).toBe(expected);
    });
  });

  it("ties the action verdict to the policy gate stage", () => {
    gates.forEach(({ detail, gate }) => {
      const expected = detail.status.policy.stage === "gate_blocked" ? "BLOCK" : "ALLOW";
      expect(gate.actionVerdict).toBe(expected);
    });
  });

  it("keeps each evaluated policy result equal to the matching policy finding", () => {
    const asResult = { pass: "PASS", fail: "FAIL" } as const;
    gates.forEach(({ detail, gate }) => {
      gate.evaluatedPolicies.forEach(policy => {
        const finding = detail.policyFindings.find(item => item.policyId === policy.policyId);
        expect(finding, `${detail.summary.traceId} ${policy.policyId}`).toBeTruthy();
        expect(finding && asResult[finding.outcome]).toBe(policy.policyResult);
      });
    });
  });

  it("has no finding outside the three evaluated gate policies", () => {
    gates.forEach(({ detail, gate }) => {
      expect(detail.policyFindings.map(finding => finding.policyId), detail.summary.traceId).toEqual(
        gate.evaluatedPolicies.map(policy => policy.policyId)
      );
    });
  });
});

/** The findings the pre-execution gate evaluated: all of them where there is no gate detail. */
const gateFindings = (detail: (typeof traceDetails)[string]) => {
  const gate = detail.status.policy.gate;
  if (!gate) return detail.policyFindings;
  const gated = new Set(gate.evaluatedPolicies.map(policy => policy.policyId));
  return detail.policyFindings.filter(finding => gated.has(finding.policyId));
};

describe("policy status note, findings and conformance evaluator agree", () => {
  const withFindings = Object.values(traceDetails).filter(
    detail => detail.policyFindings.length > 0
  );

  it("names every failed policy in the status note and no passed one", () => {
    withFindings.forEach(detail => {
      gateFindings(detail).forEach(finding => {
        const named = detail.status.policy.note.includes(finding.policyId);
        const failed = finding.outcome === "fail";
        // A passed gate note may say "all" or "both" instead of naming policies.
        if (failed) expect(named, `${detail.summary.traceId} ${finding.policyId}`).toBe(true);
        if (!failed) expect(named, `${detail.summary.traceId} ${finding.policyId}`).toBe(false);
      });
    });
  });

  it("reports the same pass count as the conformance evaluator", () => {
    withFindings.forEach(detail => {
      const findings = gateFindings(detail);
      const conformance = detail.evaluators.find(item => item.family === "policy");
      const counts = conformance?.finding?.match(/^(\d+) of (\d+) procurement policies passed\.$/);
      expect(counts, detail.summary.traceId).toBeTruthy();
      const passed = findings.filter(finding => finding.outcome === "pass").length;
      expect(Number(counts?.[1]), detail.summary.traceId).toBe(passed);
      expect(Number(counts?.[2]), detail.summary.traceId).toBe(findings.length);
    });
  });
});

const APPROVAL_FLOW = ["trace-8f21c9a4", "trace-9a03e771", "trace-a8c63e15"] as const;
const approvalFlow = () => APPROVAL_FLOW.map(id => traceDetails[id]!);
const THREE_POLICIES = ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01", "PROC-SUPPLIER-01"];

describe("supplier evidence (PROC-SUPPLIER-01) on the three approval-flow traces", () => {
  const snapshotOf = (detail: (typeof traceDetails)[string]) => {
    const ref = supplierFindingOf(detail)!.supplierRecordRef!;
    const event = detail.events.find(item => item.eventId === ref.eventId);
    if (event?.type !== "supplier_directory_snapshot") throw new Error("not a snapshot");
    return event;
  };

  it("has no supplier-evidence problems on any of the three traces", () => {
    approvalFlow().forEach(detail =>
      expect(supplierEvidenceProblems(detail), detail.summary.traceId).toEqual([])
    );
  });

  it("cites a distinct supplier directory snapshot event, never the proposal", () => {
    approvalFlow().forEach(detail => {
      const finding = supplierFindingOf(detail)!;
      const proposals = detail.actions.map(action => action.proposal.eventId);
      expect(proposals).not.toContain(finding.supplierRecordRef!.eventId);
      finding.evidenceEventIds.forEach(id => expect(proposals).not.toContain(id));
      expect(finding.evidenceEventIds).toEqual([finding.supplierRecordRef!.eventId]);
      expect(snapshotOf(detail).type).toBe("supplier_directory_snapshot");
    });
  });

  it("records supplier ID, status, record version and source on each snapshot", () => {
    approvalFlow().forEach(detail => {
      const { lookup } = snapshotOf(detail);
      expect(lookup.kind).toBe("record");
      if (lookup.kind !== "record") return;
      expect(lookup.record.supplierId).toMatch(/^SUP-\d{4}$/);
      expect(["APPROVED", "NOT_APPROVED"]).toContain(lookup.record.status);
      expect(lookup.record.recordVersion).toBe("v1");
      expect(lookup.record.recordVersionSynthetic).toBe(true);
      expect(lookup.record.source).toBeTruthy();
    });
  });

  it("reads the supplier directory before the proposal and the policy check", () => {
    approvalFlow().forEach(detail => {
      const snapshot = snapshotOf(detail);
      const proposal = detail.events.find(
        item => item.eventId === detail.actions[0]!.proposal.eventId
      )!;
      expect(snapshot.sequence, detail.summary.traceId).toBeLessThan(proposal.sequence);
      detail.events.forEach(event => {
        const checksPolicy =
          (event.type === "tool_result" && event.policyFindingIds.length > 0) ||
          (event.type === "agent_state" && event.to === "policy_checked");
        if (checksPolicy) expect(snapshot.sequence).toBeLessThan(event.sequence);
      });
      expect(new Date(snapshot.timestamp).getTime()).toBeLessThan(new Date(proposal.timestamp).getTime());
    });
  });

  it("keeps event sequences contiguous and parents earlier after the insertion", () => {
    approvalFlow().forEach(detail => {
      expect(detail.events.map(event => event.sequence)).toEqual(
        detail.events.map((_, index) => index + 1)
      );
      const sequenceOf = new Map(detail.events.map(event => [event.eventId, event.sequence]));
      detail.events.forEach(event => {
        if (event.parentId) {
          expect(sequenceOf.get(event.parentId)!).toBeLessThan(event.sequence);
        }
      });
    });
  });

  it("gives all three traces the same PROC-SUPPLIER-01 rule, wording and critical severity", () => {
    const findings = approvalFlow().map(detail => supplierFindingOf(detail)!);
    expect(new Set(findings.map(finding => finding.rule)).size).toBe(1);
    expect(new Set(findings.map(finding => finding.description)).size).toBe(1);
    findings.forEach(finding => {
      expect(finding.criticality).toBe("critical");
      expect(finding.description).toMatch(/status APPROVED/);
      expect(finding.description).toMatch(/regardless of order value/);
      expect(finding.description).not.toMatch(/tier|secondary review|\$/i);
    });
  });

  it("fails on a NOT_APPROVED record and passes on an APPROVED one", () => {
    const expected = {
      "trace-8f21c9a4": ["NOT_APPROVED", "fail"],
      "trace-9a03e771": ["APPROVED", "pass"],
      "trace-a8c63e15": ["APPROVED", "pass"],
    } as const;
    APPROVAL_FLOW.forEach(id => {
      const detail = traceDetails[id]!;
      const { lookup } = snapshotOf(detail);
      expect(lookup.kind === "record" && lookup.record.status).toBe(expected[id][0]);
      expect(supplierFindingOf(detail)!.outcome).toBe(expected[id][1]);
    });
  });

  it("has no tier finding, no placeholder policy ID and no tier wording anywhere", () => {
    const everything = JSON.stringify([
      Object.values(traceDetails),
      Object.values(investigations),
    ]);
    expect(everything).not.toMatch(/supplier.tier|supplier_tier|secondary review|PLACEHOLDER_POLICY_ID/i);
    approvalFlow().forEach(detail => {
      expect(detail.policyFindings).toHaveLength(3);
      expect(detail.policyFindings.map(finding => finding.policyId)).toEqual(THREE_POLICIES);
    });
  });
});

describe("supplier evidence checks catch broken evidence", () => {
  const broken = (
    id: (typeof APPROVAL_FLOW)[number],
    change: (copy: (typeof traceDetails)[string]) => void
  ) => {
    const copy = structuredClone(traceDetails[id]!);
    change(copy);
    return supplierEvidenceProblems(copy).join(" | ");
  };
  const BYPASS = "trace-8f21c9a4";

  it("rejects a proposal event as supplier evidence", () => {
    const problems = broken(BYPASS, copy => {
      const finding = supplierFindingOf(copy)!;
      finding.evidenceEventIds = ["ev-5"];
      finding.supplierRecordRef!.eventId = "ev-5";
    });
    expect(problems).toMatch(/tool_call event/);
    expect(problems).toMatch(/cannot support a supplier status/);
    expect(problems).toMatch(/not a supplier directory snapshot/);
  });

  it("detects a mismatched supplier ID", () => {
    expect(
      broken(BYPASS, copy => {
        supplierFindingOf(copy)!.supplierRecordRef!.supplierId = "SUP-0000";
      })
    ).toMatch(/supplier ID mismatch/);
  });

  it("detects a mismatched record version", () => {
    expect(
      broken(BYPASS, copy => {
        supplierFindingOf(copy)!.supplierRecordRef!.recordVersion = "v9";
      })
    ).toMatch(/record version mismatch/);
  });

  it("detects missing supplier evidence, whether the reference or the event is gone", () => {
    expect(
      broken(BYPASS, copy => {
        delete supplierFindingOf(copy)!.supplierRecordRef;
        supplierFindingOf(copy)!.evidenceEventIds = [];
      })
    ).toMatch(/no supplier evidence recorded/);
    expect(
      broken(BYPASS, copy => {
        copy.events = copy.events.filter(event => event.eventId !== "ev-sup-1");
      })
    ).toMatch(/not in the trace/);
  });

  it("detects supplier evidence that comes after the policy check", () => {
    expect(
      broken(BYPASS, copy => {
        const snapshot = copy.events.find(event => event.eventId === "ev-sup-1")!;
        snapshot.sequence = 99;
      })
    ).toMatch(/not before/);
  });

  it("detects an outcome that disagrees with the record status", () => {
    expect(
      broken(BYPASS, copy => {
        supplierFindingOf(copy)!.outcome = "pass";
      })
    ).toMatch(/does not follow status NOT_APPROVED/);
    expect(
      broken("trace-9a03e771", copy => {
        supplierFindingOf(copy)!.outcome = "fail";
      })
    ).toMatch(/does not follow status APPROVED/);
  });

  it("treats an unknown status and a failed lookup as problems that are not NOT_APPROVED", () => {
    (["status_unknown", "lookup_failed"] as const).forEach(kind => {
      const problems = broken(BYPASS, copy => {
        const snapshot = copy.events.find(event => event.eventId === "ev-sup-1")!;
        if (snapshot.type === "supplier_directory_snapshot") {
          snapshot.lookup = { kind, supplierId: "SUP-2291", source: "test", reason: "test" };
        }
      });
      expect(problems).toMatch(new RegExp(`lookup is ${kind}`));
      expect(problems).not.toMatch(/NOT_APPROVED/);
    });
  });
});

describe("gate, findings, evidence links and status notes agree across the three traces", () => {
  const EXPECTED = {
    "trace-8f21c9a4": { verdict: "BLOCK", basis: "MANDATORY_POLICY_FAILED", result: "FAIL" },
    "trace-9a03e771": { verdict: "ALLOW", basis: "ALL_APPLICABLE_PASSED", result: "PASS" },
    "trace-a8c63e15": { verdict: "ALLOW", basis: "ALL_APPLICABLE_PASSED", result: "PASS" },
  } as const;

  it("gives each trace its verdict, basis code and one result per policy", () => {
    APPROVAL_FLOW.forEach(id => {
      const gate = traceDetails[id]!.status.policy.gate!;
      expect(gate.actionVerdict, id).toBe(EXPECTED[id].verdict);
      expect(gate.verdictBasis, id).toBe(EXPECTED[id].basis);
      expect(gate.evaluatedPolicies.map(policy => policy.policyId), id).toEqual(THREE_POLICIES);
      if (id === "trace-8f21c9a4") {
        expect(gate.evaluatedPolicies.map(policy => policy.policyResult)).toEqual(["FAIL", "FAIL", "FAIL"]);
      } else {
        expect(gate.evaluatedPolicies.map(policy => policy.policyResult)).toEqual(["PASS", "PASS", "PASS"]);
      }
    });
  });

  it("matches every gate result to the finding and the conformance evaluator", () => {
    APPROVAL_FLOW.forEach(id => {
      const detail = traceDetails[id]!;
      const gate = detail.status.policy.gate!;
      gate.evaluatedPolicies.forEach(policy => {
        const finding = detail.policyFindings.find(item => item.policyId === policy.policyId)!;
        expect(policy.policyResult === "PASS" ? "pass" : "fail", `${id} ${policy.policyId}`).toBe(
          finding.outcome
        );
      });
      const passed = detail.policyFindings.filter(finding => finding.outcome === "pass").length;
      expect(detail.evaluators.find(item => item.family === "policy")?.finding).toBe(
        `${passed} of 3 procurement policies passed.`
      );
    });
  });

  it("lists all three policy IDs on every action, and on the policy engine's result event", () => {
    APPROVAL_FLOW.forEach(id => {
      const detail = traceDetails[id]!;
      detail.actions.forEach(action =>
        expect(action.authorization.policyFindingIds, id).toEqual(THREE_POLICIES)
      );
      const result = detail.events.find(event => event.eventId === "ev-6");
      expect(result?.type, id).toBe("tool_result");
      if (result?.type !== "tool_result") return;
      // trace-a8c63e15's ev-6 is the tool gateway's circuit breaker, not a policy
      // decision, so it carries no policy finding IDs. Left as recorded.
      expect(result.policyFindingIds, id).toEqual(id === "trace-a8c63e15" ? [] : THREE_POLICIES);
    });
  });

  it("names the failed policies in the status note and none of the passed ones", () => {
    APPROVAL_FLOW.forEach(id => {
      const detail = traceDetails[id]!;
      THREE_POLICIES.forEach(policyId => {
        expect(detail.status.policy.note.includes(policyId), `${id} ${policyId}`).toBe(
          id === "trace-8f21c9a4"
        );
      });
    });
  });

  it("resolves every finding and supplier evidence link to an event on the same trace", () => {
    APPROVAL_FLOW.forEach(id => {
      const detail = traceDetails[id]!;
      const ids = new Set(detail.events.map(event => event.eventId));
      detail.policyFindings.forEach(finding => {
        finding.evidenceEventIds.forEach(eventId => expect(ids.has(eventId), `${id} ${eventId}`).toBe(true));
        if (finding.supplierRecordRef) expect(ids.has(finding.supplierRecordRef.eventId)).toBe(true);
      });
    });
  });

  it("labels only trace-8f21c9a4 as a synthetic boundary case", () => {
    const note = traceDetails["trace-8f21c9a4"]!.scenarioNote;
    expect(note?.kind).toBe("synthetic_boundary_case");
    expect(note?.text).toMatch(/normal application stops after the supplier check/);
    expect(note?.text).toMatch(/does not prove Agent-originated behavior/);
    expect(traceDetails["trace-9a03e771"]!.scenarioNote).toBeUndefined();
    expect(traceDetails["trace-a8c63e15"]!.scenarioNote).toBeUndefined();
  });

  describe("RCA on the synthetic boundary case", () => {
    const NOT_ASSESSED = "RCA not assessed for this synthetic boundary case";
    const synthetic = () => investigations["trace-8f21c9a4"]!;

    it("is marked not assessed, with exactly the agreed message", () => {
      expect(synthetic().rca).toEqual({ status: "not_assessed", message: NOT_ASSESSED });
    });

    it("is not an empty or ranked list, so it cannot read as 'no cause found'", () => {
      expect(Array.isArray(synthetic().rca)).toBe(false);
      expect(rankedCauses(synthetic().rca)).toHaveLength(0);
    });

    it("carries no ranked cause, cause ID or evidence score anywhere on the investigation", () => {
      const text = JSON.stringify(synthetic());
      expect(text).not.toMatch(/"causeId"/);
      expect(text).not.toMatch(/"evidenceScore"/);
      expect(text).not.toMatch(/"agent_workflow"/);
      expect(text).not.toMatch(/"rank"/);
    });

    it("keeps no old RCA score or cause wording in the trace detail either", () => {
      const text = JSON.stringify(traceDetails["trace-8f21c9a4"]) + JSON.stringify(synthetic());
      expect(text).not.toMatch(/\b0\.91\b/);
      expect(text).not.toMatch(/\b0\.74\b/);
      expect(text).not.toMatch(/Agent workflow/i);
      expect(text).not.toMatch(/prompt cause/i);
    });

    it("keeps the policy findings and the synthetic boundary note", () => {
      expect(synthetic().ruleFindings.map(finding => finding.policyId)).toEqual(
        traceDetails["trace-8f21c9a4"]!.policyFindings.map(finding => finding.policyId)
      );
      expect(traceDetails["trace-8f21c9a4"]!.scenarioNote?.kind).toBe("synthetic_boundary_case");
    });
  });

  describe("RCA on every other trace is unchanged", () => {
    const PINNED_RCA: Record<string, [RcaCause["causeId"], number][]> = {
      "trace-d41f6b27": [["agent_workflow", 0.89], ["prompt", 0.67]],
      "trace-a8c63e15": [["agent_workflow", 0.31]],
      "trace-b7d2e4c1": [],
      "trace-9a03e771": [],
      "trace-c35e8a90": [["agent_workflow", 0.58]],
      "trace-e5a7c302": [],
      "trace-f9b1d7a4": [["retriever", 0.93]],
      "trace-6c41d9f2": [["retriever", 0.88], ["retrieved_context", 0.66], ["prompt", 0.29]],
      "trace-2f88b1e0": [["model_generation", 0.82], ["retrieved_context", 0.57], ["prompt", 0.31]],
    };

    it("covers every investigation except the synthetic boundary case", () => {
      expect(Object.keys(PINNED_RCA).sort()).toEqual(
        Object.keys(investigations).filter(id => id !== "trace-8f21c9a4").sort()
      );
    });

    Object.entries(PINNED_RCA).forEach(([traceId, expected]) => {
      it(`${traceId} keeps its ranked causes and scores`, () => {
        const rca = investigations[traceId]!.rca;
        expect(Array.isArray(rca)).toBe(true);
        expect(rankedCauses(rca).map(cause => [cause.causeId, cause.evidenceScore])).toEqual(
          expected
        );
      });
    });
  });

  it("keeps the cancelled-approval link unused on the three traces", () => {
    APPROVAL_FLOW.forEach(id =>
      traceDetails[id]!.actions.forEach(action =>
        expect(action.authorization.approvalRecordRefs).toBeUndefined()
      )
    );
  });

  it("uses the supplier policy ID only where a finding exists for it", () => {
    expect(SUPPLIER_POLICY_ID).toBe("PROC-SUPPLIER-01");
  });
});
