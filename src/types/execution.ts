/**
 * Action, approval and response records.
 *
 * Every value here comes from a trusted system of record (approval system,
 * policy engine, tool gateway, response gate), never from model-written text.
 * Each question is its own field: a proposal is not an authorisation, an
 * authorisation is not an invocation, and an invocation is not a known effect.
 * The UI renders these as given and never infers one from another.
 */

export type ApprovalStatus = "pending" | "approved" | "denied" | "cancelled";

export type ApprovalRecord = {
  approvalId: string;
  /** The requirement this approval satisfies, e.g. "Tier-2 approval". */
  requirement: string;
  status: ApprovalStatus;
  /** System of record that produced the status. */
  source: { system: string; recordId: string };
  /** ISO-8601 UTC. */
  requestedAt: string;
  /** Null while the approval is pending. */
  decidedAt: string | null;
  decidedBy: string | null;
  /** Note stored on the record by the decider; not model output. */
  note: string | null;
  /** Actions this approval gates. */
  actionIds: string[];
};

/**
 * PROVISIONAL (pending Mohab's SA-03 schema mechanism). A gated action refers
 * to the approval record, and the version of it, that it used. A cancellation
 * is linked to the action only through this record reference. The field names
 * and the matching rule are a placeholder, not a final mapping.
 */
export type ApprovalRecordRef = {
  approvalId: string;
  recordVersion: string;
};

export type ActionAuthorization = {
  status: "authorized" | "not_authorized";
  /** Why the policy engine reached this outcome. */
  detail: string;
  approvalIds: string[];
  /** PROVISIONAL: see {@link ApprovalRecordRef}. Absent when not recorded. */
  approvalRecordRefs?: ApprovalRecordRef[];
  policyFindingIds: string[];
};

/** `unconfirmed`: the call was dispatched but no confirmation came back. */
export type InvocationResult = "succeeded" | "failed" | "unconfirmed";

export type ActionInvocation =
  | { status: "invoked"; eventId: string; result: InvocationResult }
  /** Never dispatched to the tool. */
  | { status: "suppressed"; eventId: string | null; reason: string };

export type EffectOrigin =
  | { kind: "created"; createdAt: string }
  /** The tool returned a record that already existed; nothing new was made. */
  | { kind: "recovered"; originallyCreatedAt: string; recoveredVia: string };

/**
 * What the action changed in the world. "Unknown" is a first-class answer and
 * is never collapsed into "no effect".
 */
export type SideEffect =
  | {
      status: "known_effect";
      description: string;
      resource: { type: string; id: string };
      origin: EffectOrigin;
      evidenceEventIds: string[];
    }
  | { status: "no_effect"; basis: string; evidenceEventIds: string[] }
  | { status: "unknown"; reason: string; evidenceEventIds: string[] };

/**
 * Coarse policy stage. A stage says where the workflow stands; it is not a
 * pass/fail result and is never rendered as one.
 */
export type WorkflowPolicyStage =
  | "PRE_APPROVAL"
  | "APPROVED"
  | "PO_CREATION"
  | "COMPLETED";

/**
 * TRD-23: the stage at each boundary one action crosses.
 * Field names follow the canonical schema (policy_stage_at_proposal,
 * checked_policy_stage, policy_stage_at_dispatch, policy_stage).
 */
export type ActionBoundaryStages = {
  policyStageAtProposal: WorkflowPolicyStage;
  checkedPolicyStage: WorkflowPolicyStage;
  /** Null when the call never reached the dispatch boundary. */
  policyStageAtDispatch: WorkflowPolicyStage | null;
  /** The current context for this action. */
  policyStage: WorkflowPolicyStage;
};

export type ActionRecord = {
  actionId: string;
  tool: string;
  arguments: Record<string, string>;
  proposal: { eventId: string };
  authorization: ActionAuthorization;
  invocation: ActionInvocation;
  effect: SideEffect;
  /** TRD-23. Absent when the trace does not carry stage data. */
  stageAtBoundaries?: ActionBoundaryStages;
};

/**
 * TRD-22: one application state transition. The states are fine-grained
 * application states; `policyStage` is the associated coarse stage.
 * `attempted` means the transition was tried and not accepted.
 */
export type StateTransition = {
  /** The agent_state or tool_call event that recorded it. */
  eventId: string;
  previousState: string;
  newState: string;
  policyStage: WorkflowPolicyStage;
  disposition: "accepted" | "attempted";
};

export type ExecutionStatus =
  | "not_applicable"
  | "not_executed"
  | "executed"
  | "failed"
  | "outcome_unknown";

export type PolicyStage =
  | "not_applicable"
  | "not_evaluated"
  | "gate_passed"
  | "gate_blocked";

/**
 * What the policy engine reported for the gated action: action_verdict,
 * verdict_basis and each evaluated_policies[].policy_result. The value sets
 * are not yet specified, so they stay plain strings and are shown as given.
 */
export type PolicyGateDetail = {
  actionVerdict: string;
  verdictBasis: string;
  evaluatedPolicies: { policyId: string; policyResult: string }[];
};

/**
 * Three separate signals about one trace. The PASS / REVIEW / BLOCK
 * reliability decision is a fourth, independent signal on the trace summary.
 */
export type TraceStatus = {
  /** Application workflow state, e.g. `PRE_APPROVAL`. */
  workflow: { state: string; note: string };
  policy: { stage: PolicyStage; note: string; gate?: PolicyGateDetail };
  execution: { status: ExecutionStatus; note: string };
};

/** What a response claims about one recorded action, and whether the record agrees. */
export type ActionReference = {
  actionId: string;
  claim: string;
  /** `unverified`: the record cannot confirm or refute the claim. */
  consistency: "consistent" | "contradicted" | "unverified";
};

export type ResponseIntervention = {
  reason: string;
  policyFindingIds: string[];
  evidenceEventIds: string[];
};

/**
 * - `unchanged`: the candidate was delivered as written.
 * - `corrected`: the candidate was rewritten before delivery.
 * - `suppressed`: the candidate was withheld and replaced by a fixed message.
 * - `no_candidate`: the model produced nothing; the system sent a fallback.
 */
export type DeliveryDisposition =
  | "unchanged"
  | "corrected"
  | "suppressed"
  | "no_candidate";

export type ResponseDelivery = {
  /** The final_response event at which the candidate was gated. */
  eventId: string;
  disposition: DeliveryDisposition;
  /** Null when `disposition` is `no_candidate`. */
  rawCandidate: { text: string; actionRefs: ActionReference[] } | null;
  delivered: { text: string; actionRefs: ActionReference[] };
  interventions: ResponseIntervention[];
};
