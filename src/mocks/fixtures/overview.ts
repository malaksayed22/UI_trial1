import type {
  ApplicationSummary,
  GateSummary,
  OverviewSummary,
  TrendPoint,
} from "@/types";
import { gateSummaries } from "./gates";
import {
  DATASET_VERSION,
  EVALUATOR_SET_VERSION,
  PROCUREMENT_VERSIONS,
  RAG_VERSIONS,
} from "./shared";

const gates = (...runIds: string[]): GateSummary[] =>
  runIds.map(runId => {
    const gate = gateSummaries.find(g => g.runId === runId);
    if (!gate) throw new Error(`Missing gate summary fixture: ${runId}`);
    return gate;
  });

export const applicationSummaries: ApplicationSummary[] = [
  {
    id: "procurement-agent",
    name: "Procurement Agent",
    description: "Tool-using workflow for policy-aware purchase order creation.",
    versions: PROCUREMENT_VERSIONS,
    traceCount: 1842,
    distribution: { PASS: 1741, REVIEW: 51, BLOCK: 50 },
    latestRun: {
      runId: "run-2026-1001-0007",
      completedAt: "2026-10-01T10:02:00Z",
      datasetVersion: DATASET_VERSION,
      evaluatorSetVersion: EVALUATOR_SET_VERSION,
    },
    recentGates: gates("gate-2026-0930-03", "gate-2026-0923-02", "gate-2026-0916-01"),
  },
  {
    id: "rag-assistant",
    name: "Enterprise RAG Assistant",
    description:
      "Evidence-grounded assistant for internal policy and knowledge queries.",
    versions: RAG_VERSIONS,
    traceCount: 1196,
    distribution: { PASS: 1079, REVIEW: 103, BLOCK: 14 },
    latestRun: {
      runId: "run-2026-1001-0008",
      completedAt: "2026-10-01T10:02:00Z",
      datasetVersion: DATASET_VERSION,
      evaluatorSetVersion: EVALUATOR_SET_VERSION,
    },
    recentGates: gates("gate-2026-1001-01", "gate-2026-0928-02", "gate-2026-0926-01"),
  },
];

const trendValues = {
  pass: [182, 190, 176, 201, 195, 168, 150, 188, 204, 199, 210, 197, 185, 212],
  review: [12, 10, 14, 9, 11, 13, 8, 10, 9, 7, 8, 9, 6, 7],
  block: [5, 4, 6, 3, 4, 5, 3, 4, 3, 2, 3, 2, 3, 2],
};

const trend: TrendPoint[] = trendValues.pass.map((pass, index) => {
  const day = new Date(Date.UTC(2026, 8, 18 + index));
  return {
    date: day.toISOString().slice(0, 10),
    counts: {
      PASS: pass,
      REVIEW: trendValues.review[index] ?? 0,
      BLOCK: trendValues.block[index] ?? 0,
    },
  };
});

export const overviewSummary: OverviewSummary = {
  windowDays: 30,
  traceCount: 3038,
  distribution: { PASS: 2820, REVIEW: 154, BLOCK: 64 },
  // Primary labels of the 218 traces that need investigation (REVIEW + BLOCK).
  failureClasses: [
    { label: "unsupported_claim", count: 58 },
    { label: "retrieval_failure", count: 47 },
    { label: "approval_requirement_unmet", count: 41 },
    { label: "tool_argument_malformed", count: 28 },
    { label: "weak_grounding", count: 24 },
    { label: "prompt_injection_detected", count: 20 },
  ],
  trend,
  applications: applicationSummaries,
  recentGates: gateSummaries.slice(0, 4),
};
