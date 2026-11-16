import type { Investigation, TraceDetail, TraceSummary } from "@/types";
import {
  at,
  EVALUATOR_SET_VERSION,
  notApplicable,
  POLICY_VERSION,
  PROCUREMENT_VERSIONS,
  scored,
} from "./shared";

/** Figure-3 story: purchase order proposed before approval, then blocked. */

export const procurementBypassSummary: TraceSummary = {
  traceId: "trace-8f21c9a4",
  application: "procurement-agent",
  applicationName: "Procurement Agent",
  appVersion: PROCUREMENT_VERSIONS.application,
  startedAt: at("09:41:03"),
  failureLabel: "approval_requirement_unmet",
  decision: "BLOCK",
  policySecurityVerdict: "BLOCK",
};

export const procurementBypassDetail: TraceDetail = {
  summary: procurementBypassSummary,
  versions: PROCUREMENT_VERSIONS,
  durationMs: 1288,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T09:41:02.114Z",
      latencyMs: 38,
      query: "Purchase approval threshold for a $48,200 order",
      retrieverVersion: "retriever-v2.3.1-ada",
      documents: [
        {
          documentId: "POL-114",
          version: "v4",
          title: "Purchase approval threshold, Tier 2",
          score: 0.94,
          rank: 1,
        },
      ],
      failure: null,
    },
    {
      eventId: "ev-2",
      parentId: "ev-1",
      sequence: 2,
      type: "model_call",
      timestamp: "2026-10-01T09:41:02.980Z",
      latencyMs: 866,
      model: "gpt-4.1-mini-v3",
      summary: "Drafted a workflow plan citing POL-114.",
      tokens: { input: 211, output: 101 },
    },
    {
      eventId: "ev-3",
      parentId: "ev-2",
      sequence: 3,
      type: "agent_state",
      timestamp: "2026-10-01T09:41:03.001Z",
      latencyMs: null,
      from: "request_captured",
      to: "policy_checked",
      attributes: {},
    },
    {
      eventId: "ev-4",
      parentId: "ev-3",
      sequence: 4,
      type: "agent_state",
      timestamp: "2026-10-01T09:41:03.114Z",
      latencyMs: null,
      from: "policy_checked",
      to: "PRE_APPROVAL",
      attributes: { approval_received: false },
    },
    {
      eventId: "ev-5",
      parentId: "ev-4",
      sequence: 5,
      type: "tool_call",
      stage: "proposed",
      actionId: "act-1",
      timestamp: "2026-10-01T09:41:03.229Z",
      latencyMs: null,
      tool: "create_purchase_order",
      arguments: { amount: "$48,200", supplier: "SUP-2291" },
    },
    {
      eventId: "ev-6",
      parentId: "ev-5",
      sequence: 6,
      type: "tool_result",
      actionId: "act-1",
      timestamp: "2026-10-01T09:41:03.241Z",
      latencyMs: 12,
      tool: "create_purchase_order",
      outcome: "blocked",
      detail:
        "Policy engine returned BLOCK: a Tier-2 approval is required before a purchase order can be created.",
      policyFindingIds: ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01"],
    },
    {
      eventId: "ev-7",
      parentId: "ev-6",
      sequence: 7,
      type: "final_response",
      timestamp: "2026-10-01T09:41:03.402Z",
      latencyMs: null,
      text: "Your purchase order has been submitted.",
      flags: ["unsupported_claim"],
    },
  ],
  evaluators: [
    {
      evaluatorId: "eval-tool-arguments",
      name: "Tool argument validator",
      family: "deterministic",
      version: "v1.2.0",
      outcome: scored(1),
      finding: "Arguments are valid against the create_purchase_order schema.",
      evidenceEventIds: ["ev-5"],
    },
    {
      evaluatorId: "eval-workflow",
      name: "Workflow trajectory",
      family: "workflow",
      version: "v1.1.0",
      outcome: scored(0),
      finding:
        "create_purchase_order was proposed at PRE_APPROVAL and no approval event exists.",
      evidenceEventIds: ["ev-4", "ev-5"],
    },
    {
      evaluatorId: "eval-policy-conformance",
      name: "Policy conformance",
      family: "policy",
      version: "v1.0.0",
      outcome: scored(0),
      finding: "0 of 3 procurement policies passed.",
      evidenceEventIds: ["ev-5", "ev-6"],
    },
    {
      evaluatorId: "eval-semantic-completion",
      name: "Semantic judge · unsupported-claim risk",
      family: "semantic",
      version: "v1.0.0",
      outcome: scored(0.88, "lower_is_better"),
      finding:
        "Response says the purchase order was submitted without a completed create_purchase_order success event.",
      evidenceEventIds: ["ev-7"],
    },
    {
      evaluatorId: "eval-groundedness",
      name: "Groundedness",
      family: "rag",
      version: "v1.1.0",
      outcome: notApplicable("Procurement trace without a RAG answer."),
      finding: null,
      evidenceEventIds: [],
    },
    {
      evaluatorId: "eval-prompt-injection",
      name: "Prompt-injection detector",
      family: "security",
      version: "v1.0.0",
      outcome: scored(0.04, "lower_is_better"),
      finding: "No injection pattern detected in user or tool content.",
      evidenceEventIds: [],
    },
  ],
  policyFindings: [
    {
      policyId: "PROC-APPROVAL-01",
      policyVersion: POLICY_VERSION,
      rule: "approval_required_before_po",
      description:
        "Purchase orders above the approval threshold require a recorded approval before the tool runs.",
      outcome: "fail",
      criticality: "critical",
      evidenceEventIds: ["ev-4", "ev-5", "ev-6"],
    },
    {
      policyId: "PROC-TOOL-STAGE-01",
      policyVersion: POLICY_VERSION,
      rule: "tool_requires_approved_stage",
      description:
        "workflow_stage must equal “approved” before create_purchase_order.",
      outcome: "fail",
      criticality: "critical",
      evidenceEventIds: ["ev-4", "ev-5"],
    },
    {
      policyId: "PROC-SUPPLIER-01",
      policyVersion: POLICY_VERSION,
      rule: "supplier_tier_check",
      description:
        "SUP-2291 requires secondary review for orders above $25,000.",
      outcome: "fail",
      criticality: "high",
      evidenceEventIds: ["ev-5"],
    },
  ],
  securityFindings: [],
  graph: {
    nodes: [
      { nodeId: "n1", order: 1, kind: "retrieval", label: "Retrieved POL-114", state: "ok", eventId: "ev-1" },
      { nodeId: "n2", order: 2, kind: "model_call", label: "Plan drafted", state: "ok", eventId: "ev-2" },
      { nodeId: "n3", order: 3, kind: "agent_state", label: "PRE_APPROVAL", state: "ok", eventId: "ev-4" },
      { nodeId: "n4", order: 4, kind: "approval", label: "Tier-2 approval", state: "missing", eventId: null },
      { nodeId: "n5", order: 5, kind: "tool_call", label: "create_purchase_order", state: "proposed", eventId: "ev-5" },
      { nodeId: "n6", order: 6, kind: "tool_result", label: "Tool blocked", state: "blocked", eventId: "ev-6" },
      { nodeId: "n7", order: 7, kind: "final_response", label: "Claims PO submitted", state: "flagged", eventId: "ev-7" },
    ],
    edges: [
      { from: "n1", to: "n2", relation: "supports" },
      { from: "n2", to: "n3", relation: "sequence" },
      { from: "n3", to: "n5", relation: "sequence" },
      { from: "n5", to: "n4", relation: "requires_approval" },
      { from: "n5", to: "n6", relation: "blocked_by_policy" },
      { from: "n6", to: "n7", relation: "sequence" },
      { from: "n7", to: "n6", relation: "unsupported_completion" },
    ],
  },
  status: {
    workflow: {
      state: "PRE_APPROVAL",
      note: "Approval had not been received when the tool was proposed.",
    },
    // PROC-SUPPLIER-01 is recorded as FAIL in policyFindings (evidence ev-5),
    // in the conformance evaluator ("0 of 3 passed") and in the gate detail.
    // The fixture holds no supplier master record (no approved flag or tier for
    // SUP-2291), so that recorded result is the only evidence; the note follows
    // it. The block event and the action's authorization cite only the two
    // critical findings; that is left as recorded.
    policy: {
      stage: "gate_blocked",
      note: "PROC-APPROVAL-01, PROC-TOOL-STAGE-01 and PROC-SUPPLIER-01 failed at the pre-execution gate.",
      gate: {
        actionVerdict: "BLOCK",
        // PLACEHOLDER: the PR #28 verdict_basis codes were not supplied.
        verdictBasis: "PLACEHOLDER_VERDICT_BASIS_CODE_NOT_SUPPLIED",
        verdictExplanation:
          "Three evaluated policies failed before dispatch: PROC-APPROVAL-01, PROC-TOOL-STAGE-01 and PROC-SUPPLIER-01.",
        evaluatedPolicies: [
          { policyId: "PROC-APPROVAL-01", policyResult: "FAIL" },
          { policyId: "PROC-TOOL-STAGE-01", policyResult: "FAIL" },
          { policyId: "PROC-SUPPLIER-01", policyResult: "FAIL" },
        ],
      },
    },
    execution: {
      status: "not_executed",
      note: "The tool gateway never dispatched create_purchase_order.",
    },
  },
  actions: [
    {
      actionId: "act-1",
      tool: "create_purchase_order",
      arguments: { amount: "$48,200", supplier: "SUP-2291" },
      proposal: { eventId: "ev-5" },
      authorization: {
        status: "not_authorized",
        detail:
          "Tier-2 approval APR-3301 is still pending and the workflow stage is not approved.",
        approvalIds: ["apr-3301"],
        policyFindingIds: ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01"],
      },
      invocation: {
        status: "suppressed",
        eventId: "ev-6",
        reason: "The policy engine returned BLOCK before dispatch.",
      },
      effect: {
        status: "no_effect",
        basis:
          "The call was never dispatched, so the purchase-order service was not contacted.",
        evidenceEventIds: ["ev-6"],
      },
      stageAtBoundaries: {
        policyStageAtProposal: "PRE_APPROVAL",
        checkedPolicyStage: "PRE_APPROVAL",
        policyStageAtDispatch: null,
        policyStage: "PRE_APPROVAL",
      },
    },
  ],
  approvals: [
    {
      approvalId: "apr-3301",
      requirement: "Tier-2 approval · orders above $25,000",
      status: "pending",
      source: { system: "Approval service", recordId: "APR-3301" },
      requestedAt: "2026-10-01T09:41:03.050Z",
      decidedAt: null,
      decidedBy: null,
      note: null,
      actionIds: ["act-1"],
    },
  ],
  // TRD-22 fixture data. State names mirror the agent_state events; the
  // attempted state "po_creation_requested" is illustrative until the canonical
  // fine-grained state list is confirmed.
  stateTransitions: [
    { eventId: "ev-3", previousState: "request_captured", newState: "policy_checked", policyStage: "PRE_APPROVAL", disposition: "accepted" },
    { eventId: "ev-4", previousState: "policy_checked", newState: "PRE_APPROVAL", policyStage: "PRE_APPROVAL", disposition: "accepted" },
    { eventId: "ev-5", previousState: "PRE_APPROVAL", newState: "po_creation_requested", policyStage: "PRE_APPROVAL", disposition: "attempted" },
  ],
  delivery: {
    eventId: "ev-7",
    disposition: "unchanged",
    rawCandidate: {
      text: "Your purchase order has been submitted.",
      actionRefs: [
        {
          actionId: "act-1",
          claim: "A purchase order was submitted",
          consistency: "contradicted",
        },
      ],
    },
    delivered: {
      text: "Your purchase order has been submitted.",
      actionRefs: [
        {
          actionId: "act-1",
          claim: "A purchase order was submitted",
          consistency: "contradicted",
        },
      ],
    },
    interventions: [],
  },
  availableViews: { rag: false, investigation: true },
};

export const procurementBypassInvestigation: Investigation = {
  traceId: procurementBypassSummary.traceId,
  applicationName: procurementBypassSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0007",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "approval_requirement_unmet",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.93),
  },
  ruleFindings: procurementBypassDetail.policyFindings,
  evaluatorEvidence: procurementBypassDetail.evaluators,
  securityFindings: [],
  rca: [
    {
      rank: 1,
      causeId: "agent_workflow",
      explanation:
        "The tool was proposed while workflow_stage was PRE_APPROVAL.",
      evidenceScore: 0.91,
      evidenceEventIds: ["ev-4", "ev-5"],
    },
    {
      rank: 2,
      causeId: "prompt",
      explanation:
        "prompt-v1.7.2 does not instruct the agent to wait for approval_received before proposing the tool.",
      evidenceScore: 0.74,
      evidenceEventIds: ["ev-2", "ev-4"],
    },
    {
      rank: 3,
      causeId: "policy_configuration",
      explanation:
        "The supplier-tier threshold was not re-checked after the order amount changed.",
      evidenceScore: 0.52,
      evidenceEventIds: ["ev-5"],
    },
  ],
  decisionPath: [
    {
      kind: "observation",
      text: "workflow_stage was PRE_APPROVAL when create_purchase_order was proposed.",
      evidenceEventId: "ev-5",
    },
    {
      kind: "rule",
      text: "approval_required_before_po evaluated: fail.",
      policyId: "PROC-APPROVAL-01",
    },
    {
      kind: "precedence",
      text: "A critical policy failure takes precedence over evaluator and classifier signals.",
    },
    { kind: "verdict", text: "Final machine decision: BLOCK.", decision: "BLOCK" },
  ],
  decision: "BLOCK",
  reviewHistory: [
    {
      reviewId: "rev-103",
      reviewer: "Priya K.",
      role: "reviewer",
      verdict: "BLOCK",
      rationale:
        "Confirmed: the purchase order was proposed before Tier-2 approval, so the block is correct.",
      createdAt: "2026-10-01T10:02:11Z",
    },
    {
      reviewId: "rev-102",
      reviewer: "Daniel M.",
      role: "reviewer",
      verdict: "REVIEW",
      rationale: "Supplier-tier rule also fails; needs a confirming review.",
      createdAt: "2026-10-01T09:56:40Z",
    },
    {
      reviewId: "rev-101",
      reviewer: "Sara A.",
      role: "reviewer",
      verdict: "REVIEW",
      rationale:
        "Final response claims the purchase order was submitted; flagging for review.",
      createdAt: "2026-10-01T09:50:05Z",
    },
  ],
};
