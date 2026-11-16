import type { Criticality, Decision, Role } from "./common";

/**
 * An authoritative supplier record, as read from the supplier system of record.
 * PROC-SUPPLIER-01 passes only when the proposed purchase order's supplier
 * matches a record with status APPROVED (Nour's definition). The status values
 * are the two this contract is known to use; a third value is NOT FOUND.
 */
export type SupplierRecord = {
  supplierId: string;
  status: "APPROVED" | "NOT_APPROVED";
  recordVersion: string;
  /** Trace events that show this record was the one used. */
  evidenceEventIds: string[];
};

/** Points a finding at the exact supplier record, and version, it relied on. */
export type SupplierRecordRef = {
  supplierId: string;
  recordVersion: string;
};

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
  /** The supplier record this finding relied on. Set only by supplier checks. */
  supplierRecordRef?: SupplierRecordRef;
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
