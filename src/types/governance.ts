import type { Criticality, Decision, Role } from "./common";

/**
 * APPLICATION-LOCAL, pending Mohab's canonical mapping. The supplier fields in
 * this file are the application's own shape for showing supplier evidence; none
 * of the names is a canonical contract field yet.
 *
 * An authoritative supplier record as read from the supplier directory.
 * PROC-SUPPLIER-01 checks the matching record's status, independent of order
 * value.
 */
export type SupplierRecord = {
  supplierId: string;
  /**
   * APPROVED and NOT_APPROVED are the two statuses the fixtures use, pending
   * Mohab's canonical mapping. This is not a complete or canonical status set.
   */
  status: "APPROVED" | "NOT_APPROVED";
  recordVersion: string;
  /**
   * SYNTHETIC: the version string is a fixture value, not a version issued by
   * a real supplier directory. Always shown as synthetic.
   */
  recordVersionSynthetic: true;
  /** Where the record came from. A fixture value. */
  source: string;
};

/**
 * What a supplier-directory lookup produced. A record with a status, a status
 * that is unknown and a failed lookup are three different outcomes. None of the
 * last two is NOT_APPROVED, and neither is a fail by status.
 */
export type SupplierLookup =
  | { kind: "record"; record: SupplierRecord }
  | { kind: "status_unknown"; supplierId: string; source: string; reason: string }
  | { kind: "lookup_failed"; supplierId: string; source: string; reason: string };

/**
 * Points a finding at the exact supplier record, version and evidence event it
 * relied on. APPLICATION-LOCAL, pending Mohab's canonical mapping.
 */
export type SupplierRecordRef = {
  supplierId: string;
  recordVersion: string;
  /** The supplier directory snapshot event. A tool proposal cannot be this. */
  eventId: string;
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
