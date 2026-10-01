import type { Criticality, Decision, Role } from "./common";

/** Deterministic procurement policy check (owned by the governance engine). */
export type PolicyFinding = {
  policyId: string;
  policyVersion: string;
  rule: string;
  description: string;
  outcome: "pass" | "fail";
  criticality: Criticality;
  /** Trace events that support this finding. */
  evidenceEventIds: string[];
};

/**
 * Security evidence. Detector outcome and observed action are reported
 * separately: a missed detection never implies the action was authorised.
 */
export type SecurityFinding = {
  attackCategory: string;
  detectorOutcome: "detected" | "missed" | "not_evaluated";
  observedUnsafeAction: string | null;
  policyProtectionHeld: boolean | null;
  evidenceEventIds: string[];
};

export type DecisionStep =
  | { kind: "observation"; text: string; evidenceEventId?: string }
  | { kind: "rule"; text: string; policyId: string }
  | { kind: "precedence"; text: string }
  | { kind: "verdict"; text: string; decision: Decision };

export type ReviewVerdict = "ACCEPT" | "REVIEW" | "BLOCK";

/** Human review entries are append-only and never replace the machine decision. */
export type ReviewEntry = {
  reviewId: string;
  reviewer: string;
  role: Role;
  verdict: ReviewVerdict;
  rationale: string;
  createdAt: string;
};

export type ReviewTarget =
  | { kind: "trace"; traceId: string }
  | { kind: "release"; runId: string };

export type Viewer = {
  name: string;
  initials: string;
  role: Role;
  permissions: { canReview: boolean };
};

export type ReviewSubmission = {
  target: ReviewTarget;
  verdict: ReviewVerdict;
  rationale: string;
};
