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

  it("highlights only claims that appear in the answer", () => {
    Object.values(ragDiagnostics).forEach(diagnostics => {
      diagnostics.unsupportedClaims.forEach(({ claim }) => {
        expect(diagnostics.answer.toLowerCase()).toContain(claim.toLowerCase());
      });
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
