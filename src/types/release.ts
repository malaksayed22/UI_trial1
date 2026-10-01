import type { GateVerdict, VersionSet } from "./common";
import type { ReviewEntry } from "./governance";

export type GateSignal = "regression" | "watch" | "stable" | "improved";

export type GateArea = "RAG" | "Agent" | "Security" | "Overall";

/** Deltas and signals are computed by the gate; the UI never recomputes them. */
export type GateMetric = {
  area: GateArea;
  name: string;
  direction: "higher_is_better" | "lower_is_better";
  baseline: number;
  candidate: number;
  delta: number;
  signal: GateSignal;
};

export type CriticalCase = {
  title: string;
  affected: number;
  total: number;
  traceId: string;
};

export type GateConfiguration = {
  label: string;
  versions: VersionSet;
};

export type GateSummary = {
  runId: string;
  /** Candidate component under evaluation, e.g. "retriever-v2.4.0". */
  candidateLabel: string;
  verdict: GateVerdict;
  completedAt: string;
};

export type GateRun = {
  runId: string;
  startedAt: string;
  /** Anything but "complete" can never display a PASS verdict. */
  status: "complete" | "incomplete" | "failed";
  verdict: GateVerdict;
  reasons: string[];
  baseline: GateConfiguration;
  candidate: GateConfiguration;
  datasetVersion: string;
  evaluatorSetVersion: string;
  traceCount: number;
  metrics: GateMetric[];
  criticalCases: CriticalCase[];
  /** Path of the canonical JSON artifact this view mirrors. */
  artifactPath: string;
  reviewHistory: ReviewEntry[];
};
