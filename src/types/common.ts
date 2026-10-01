/**
 * Shared primitives for the Reliability UX contracts.
 *
 * The frontend renders values produced by the backend modules; it never
 * recomputes scores, rankings, graphs or decisions.
 */

export type Decision = "PASS" | "REVIEW" | "BLOCK";

/** Release-gate verdict. A failed or partial evaluation is never a PASS. */
export type GateVerdict = Decision | "INCOMPLETE";

export type ApplicationId = "procurement-agent" | "rag-assistant";

export type Criticality = "critical" | "high" | "medium" | "low";

export type Role = "engineer" | "reviewer" | "admin";

/**
 * A measured value together with its meaning. "Not evaluated", "evaluator
 * failed" and "not applicable" are distinct states and must never render as 0.
 */
export type Measurement =
  | {
      status: "scored";
      value: number;
      direction: "higher_is_better" | "lower_is_better";
      range: readonly [number, number];
    }
  | { status: "not_evaluated" }
  | { status: "evaluator_failed"; reason: string }
  | { status: "not_applicable"; reason: string };

export type ScoredMeasurement = Extract<Measurement, { status: "scored" }>;

export type VersionSet = {
  application: string;
  model: string;
  prompt: string;
  /** Null for applications without a retriever (e.g. the Procurement Agent). */
  retriever: string | null;
};

/** Identifies the evaluation run a diagnosis was produced by. */
export type Provenance = {
  runId: string;
  evaluatorSetVersion: string;
  /** Null for live traces that are not part of a versioned dataset. */
  datasetVersion: string | null;
};

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

/** Marks where the data came from, so fixtures are never mistaken for results. */
export type DataSourceKind = "fixture" | "live";
