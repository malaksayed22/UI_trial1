import type { GateMetric, GateRun, GateSummary, VersionSet } from "@/types";
import {
  DATASET_VERSION,
  EVALUATOR_SET_VERSION,
  PROCUREMENT_VERSIONS,
  RAG_VERSIONS,
} from "./shared";

const metric = (
  area: GateMetric["area"],
  name: string,
  baseline: number,
  candidate: number,
  signal: GateMetric["signal"],
  direction: GateMetric["direction"] = "higher_is_better"
): GateMetric => ({
  area,
  name,
  direction,
  baseline,
  candidate,
  delta: Math.round((candidate - baseline) * 100) / 100,
  signal,
});

const withVersions = (base: VersionSet, patch: Partial<VersionSet>) => ({
  ...base,
  ...patch,
});

export const gateSummaries: GateSummary[] = [
  { runId: "gate-2026-1001-01", candidateLabel: "retriever-v2.4.0", verdict: "BLOCK", completedAt: "2026-10-01T10:14:38Z" },
  { runId: "gate-2026-0930-03", candidateLabel: "agent-v2.4.1", verdict: "PASS", completedAt: "2026-09-30T11:20:00Z" },
  { runId: "gate-2026-0928-02", candidateLabel: "prompt-v1.9.0", verdict: "REVIEW", completedAt: "2026-09-28T13:30:10Z" },
  { runId: "gate-2026-0926-01", candidateLabel: "model-v1.8.2", verdict: "PASS", completedAt: "2026-09-26T09:12:00Z" },
  { runId: "gate-2026-0923-02", candidateLabel: "agent-v2.3.9", verdict: "PASS", completedAt: "2026-09-23T15:40:00Z" },
  { runId: "gate-2026-0916-01", candidateLabel: "agent-v2.3.8", verdict: "REVIEW", completedAt: "2026-09-16T10:05:00Z" },
];

const gateSummary = (runId: string) => {
  const summary = gateSummaries.find(g => g.runId === runId);
  if (!summary) throw new Error(`Missing gate summary fixture: ${runId}`);
  return summary;
};

export const gateRuns: GateRun[] = [
  {
    runId: "gate-2026-1001-01",
    startedAt: "2026-10-01T09:58:12Z",
    status: "complete",
    verdict: gateSummary("gate-2026-1001-01").verdict,
    reasons: [
      "RAG groundedness regressed by 0.12 on dataset-v1.4.0 (12 of 40 international-travel cases affected).",
      "Overall failure rate rose from 0.08 to 0.13.",
      "No critical policy or security regression was found.",
      "Rule applied: a severe regression without a critical failure resolves to BLOCK.",
    ],
    baseline: { label: "Approved baseline", versions: RAG_VERSIONS },
    candidate: {
      label: "Candidate",
      versions: withVersions(RAG_VERSIONS, { retriever: "retriever-v2.4.0" }),
    },
    datasetVersion: DATASET_VERSION,
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    traceCount: 1200,
    metrics: [
      metric("RAG", "Groundedness", 0.91, 0.79, "regression"),
      metric("RAG", "Citation support", 0.83, 0.81, "watch"),
      metric("Agent", "Workflow compliance", 0.97, 0.96, "stable"),
      metric("Security", "Detector recall", 0.88, 0.88, "stable"),
      metric("Overall", "Failure rate", 0.08, 0.13, "regression", "lower_is_better"),
      metric("Overall", "Reliability", 0.9, 0.86, "regression"),
    ],
    criticalCases: [
      {
        title: "Retrieval regression on the international-travel query set",
        affected: 12,
        total: 40,
        traceId: "trace-2f88b1e0",
      },
      {
        title: "Grounding regression on HR policy queries",
        affected: 5,
        total: 40,
        traceId: "trace-6c41d9f2",
      },
    ],
    artifactPath: "artifacts/gate-2026-1001-01/gate_result.json",
    reviewHistory: [],
  },
  {
    runId: "gate-2026-0928-02",
    startedAt: "2026-09-28T13:12:44Z",
    status: "complete",
    verdict: gateSummary("gate-2026-0928-02").verdict,
    reasons: [
      "Citation support dropped by 0.05, a borderline semantic-quality change.",
      "No critical policy or security regression was found.",
      "Rule applied: borderline quality resolves to REVIEW. REVIEW is not an approval and needs a human decision.",
    ],
    baseline: {
      label: "Approved baseline",
      versions: withVersions(RAG_VERSIONS, { prompt: "prompt-v3.1.4" }),
    },
    candidate: { label: "Candidate", versions: RAG_VERSIONS },
    datasetVersion: DATASET_VERSION,
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    traceCount: 1200,
    metrics: [
      metric("RAG", "Groundedness", 0.91, 0.9, "stable"),
      metric("RAG", "Citation support", 0.83, 0.78, "watch"),
      metric("Agent", "Workflow compliance", 0.97, 0.97, "stable"),
      metric("Security", "Detector recall", 0.88, 0.88, "stable"),
      metric("Overall", "Failure rate", 0.08, 0.09, "watch", "lower_is_better"),
      metric("Overall", "Reliability", 0.9, 0.88, "watch"),
    ],
    criticalCases: [
      {
        title: "Citation drift on multi-document answers",
        affected: 7,
        total: 40,
        traceId: "trace-2f88b1e0",
      },
    ],
    artifactPath: "artifacts/gate-2026-0928-02/gate_result.json",
    reviewHistory: [],
  },
  {
    runId: "gate-2026-0930-03",
    startedAt: "2026-09-30T11:02:09Z",
    status: "complete",
    verdict: gateSummary("gate-2026-0930-03").verdict,
    reasons: [
      "All compared metrics are within versioned tolerance.",
      "No critical policy or security regression was found.",
    ],
    baseline: {
      label: "Approved baseline",
      versions: withVersions(PROCUREMENT_VERSIONS, {
        application: "app-v2.3.9",
        prompt: "prompt-v1.7.1",
      }),
    },
    candidate: { label: "Candidate", versions: PROCUREMENT_VERSIONS },
    datasetVersion: DATASET_VERSION,
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    traceCount: 1200,
    metrics: [
      metric("RAG", "Groundedness", 0.91, 0.91, "stable"),
      metric("RAG", "Citation support", 0.83, 0.83, "stable"),
      metric("Agent", "Workflow compliance", 0.96, 0.97, "improved"),
      metric("Security", "Detector recall", 0.88, 0.88, "stable"),
      metric("Overall", "Failure rate", 0.08, 0.07, "improved", "lower_is_better"),
      metric("Overall", "Reliability", 0.89, 0.9, "improved"),
    ],
    criticalCases: [],
    artifactPath: "artifacts/gate-2026-0930-03/gate_result.json",
    reviewHistory: [],
  },
];

export const latestGateRunId = "gate-2026-1001-01";
