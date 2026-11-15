import type { Investigation, TraceDetail, TraceSummary } from "@/types";
import {
  at,
  EVALUATOR_SET_VERSION,
  notApplicable,
  POLICY_VERSION,
  PROCUREMENT_VERSIONS,
  scored,
} from "./shared";

/**
 * Approved, authorised and policy-clean, yet the call never ran: the tool
 * gateway's circuit breaker was open, so nothing was dispatched. Authorisation
 * is not invocation. The response is honest, the policy verdict is PASS, and
 * the task is still incomplete, so the decision is REVIEW.
 */

const DELIVERED =
  "Your purchase order was approved, but I could not submit it: the purchase-order service is temporarily unreachable. Nothing was created. Please resubmit shortly; a reviewer has been notified.";

export const procurementNotDispatchedSummary: TraceSummary = {
  traceId: "trace-a8c63e15",
  application: "procurement-agent",
  applicationName: "Procurement Agent",
  appVersion: PROCUREMENT_VERSIONS.application,
  startedAt: at("10:31:12"),
  failureLabel: "tool_not_dispatched",
  decision: "REVIEW",
  policySecurityVerdict: "PASS",
};

const policyFindings: TraceDetail["policyFindings"] = [
  {
    policyId: "PROC-APPROVAL-01",
    policyVersion: POLICY_VERSION,
    rule: "approval_required_before_po",
    description:
      "Purchase orders above the approval threshold require a recorded approval before the tool runs.",
    outcome: "pass",
    criticality: "critical",
    evidenceEventIds: ["ev-4", "ev-5"],
  },
  {
    policyId: "PROC-TOOL-STAGE-01",
    policyVersion: POLICY_VERSION,
    rule: "tool_requires_approved_stage",
    description:
      "workflow_stage must equal “approved” before create_purchase_order.",
    outcome: "pass",
    criticality: "critical",
    evidenceEventIds: ["ev-4", "ev-5"],
  },
  {
    policyId: "PROC-SUPPLIER-01",
    policyVersion: POLICY_VERSION,
    rule: "supplier_tier_check",
    description: "SUP-2468 is an approved supplier at this order value.",
    outcome: "pass",
    criticality: "high",
    evidenceEventIds: ["ev-5"],
  },
];

const evaluators: TraceDetail["evaluators"] = [
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
    outcome: scored(0.5),
    finding:
      "Approval was recorded and the tool was proposed in order, but the call was never dispatched, so the workflow did not complete.",
    evidenceEventIds: ["ev-4", "ev-5", "ev-6"],
  },
  {
    evaluatorId: "eval-policy-conformance",
    name: "Policy conformance",
    family: "policy",
    version: "v1.0.0",
    outcome: scored(1),
    finding: "3 of 3 procurement policies passed.",
    evidenceEventIds: ["ev-5", "ev-6"],
  },
  {
    evaluatorId: "eval-semantic-completion",
    name: "Semantic judge · unsupported-claim risk",
    family: "semantic",
    version: "v1.0.0",
    outcome: scored(0.04, "lower_is_better"),
    finding: "The response correctly says no purchase order was created.",
    evidenceEventIds: ["ev-6", "ev-7"],
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
    outcome: scored(0.02, "lower_is_better"),
    finding: "No injection pattern detected in user or tool content.",
    evidenceEventIds: [],
  },
];

export const procurementNotDispatchedDetail: TraceDetail = {
  summary: procurementNotDispatchedSummary,
  versions: PROCUREMENT_VERSIONS,
  durationMs: 1486,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T10:31:11.870Z",
      latencyMs: 43,
      query: "Purchase approval threshold for a $22,500 order",
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
      timestamp: "2026-10-01T10:31:12.700Z",
      latencyMs: 790,
      model: "gpt-4.1-mini-v3",
      summary: "Drafted a workflow plan citing POL-114.",
      tokens: { input: 206, output: 97 },
    },
    {
      eventId: "ev-3",
      parentId: "ev-2",
      sequence: 3,
      type: "agent_state",
      timestamp: "2026-10-01T10:31:12.730Z",
      latencyMs: null,
      from: "request_captured",
      to: "approval_pending",
      attributes: { approval_requested: true },
    },
    {
      eventId: "ev-4",
      parentId: "ev-3",
      sequence: 4,
      type: "agent_state",
      timestamp: "2026-10-01T10:31:12.980Z",
      latencyMs: null,
      from: "approval_pending",
      to: "approved",
      attributes: { approval_received: true },
    },
    {
      eventId: "ev-5",
      parentId: "ev-4",
      sequence: 5,
      type: "tool_call",
      stage: "proposed",
      actionId: "act-1",
      timestamp: "2026-10-01T10:31:13.090Z",
      latencyMs: null,
      tool: "create_purchase_order",
      arguments: { amount: "$22,500", supplier: "SUP-2468" },
    },
    {
      eventId: "ev-6",
      parentId: "ev-5",
      sequence: 6,
      type: "tool_result",
      actionId: "act-1",
      timestamp: "2026-10-01T10:31:13.101Z",
      latencyMs: 11,
      tool: "create_purchase_order",
      outcome: "blocked",
      detail:
        "Tool gateway rejected the call before dispatch: circuit breaker open for purchase-order-service. The policy gate had already passed.",
      policyFindingIds: [],
    },
    {
      eventId: "ev-7",
      parentId: "ev-6",
      sequence: 7,
      type: "final_response",
      timestamp: "2026-10-01T10:31:13.198Z",
      latencyMs: null,
      text: DELIVERED,
      flags: [],
    },
  ],
  evaluators,
  policyFindings,
  securityFindings: [],
  graph: {
    nodes: [
      { nodeId: "n1", order: 1, kind: "retrieval", label: "Retrieved POL-114", state: "ok", eventId: "ev-1" },
      { nodeId: "n2", order: 2, kind: "model_call", label: "Plan drafted", state: "ok", eventId: "ev-2" },
      { nodeId: "n3", order: 3, kind: "approval", label: "Tier-2 approval", state: "ok", eventId: "ev-4" },
      { nodeId: "n4", order: 4, kind: "tool_call", label: "create_purchase_order", state: "proposed", eventId: "ev-5" },
      { nodeId: "n5", order: 5, kind: "tool_result", label: "Gateway rejected call", state: "blocked", eventId: "ev-6" },
      { nodeId: "n6", order: 6, kind: "final_response", label: "Failure reported", state: "ok", eventId: "ev-7" },
    ],
    edges: [
      { from: "n1", to: "n2", relation: "supports" },
      { from: "n2", to: "n3", relation: "sequence" },
      { from: "n3", to: "n4", relation: "sequence" },
      { from: "n4", to: "n3", relation: "requires_approval" },
      { from: "n4", to: "n5", relation: "sequence" },
      { from: "n5", to: "n6", relation: "sequence" },
    ],
  },
  status: {
    workflow: {
      state: "approved",
      note: "Approval was recorded before the tool was proposed.",
    },
    policy: {
      stage: "gate_passed",
      note: "All three procurement policies passed at the pre-execution gate.",
      gate: {
        actionVerdict: "PASS",
        verdictBasis:
          "All three evaluated procurement policies passed before dispatch. The gateway then refused to dispatch; that was not a policy decision.",
        evaluatedPolicies: [
          { policyId: "PROC-APPROVAL-01", policyResult: "pass" },
          { policyId: "PROC-TOOL-STAGE-01", policyResult: "pass" },
          { policyId: "PROC-SUPPLIER-01", policyResult: "pass" },
        ],
      },
    },
    execution: {
      status: "not_executed",
      note: "The tool gateway rejected create_purchase_order before dispatch. Nothing was sent.",
    },
  },
  actions: [
    {
      actionId: "act-1",
      tool: "create_purchase_order",
      arguments: { amount: "$22,500", supplier: "SUP-2468" },
      proposal: { eventId: "ev-5" },
      authorization: {
        status: "authorized",
        detail: "Tier-2 approval APR-6034 was approved before the tool was proposed.",
        approvalIds: ["apr-6034"],
        policyFindingIds: ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01", "PROC-SUPPLIER-01"],
      },
      invocation: {
        status: "suppressed",
        eventId: "ev-6",
        reason:
          "The tool gateway's circuit breaker for purchase-order-service was open, so the call was never dispatched. This was not a policy decision.",
      },
      effect: {
        status: "no_effect",
        basis:
          "The call was never dispatched, so the purchase-order service was not contacted.",
        evidenceEventIds: ["ev-6"],
      },
      stageAtBoundaries: {
        policyStageAtProposal: "APPROVED",
        checkedPolicyStage: "APPROVED",
        policyStageAtDispatch: null,
        policyStage: "APPROVED",
      },
    },
  ],
  approvals: [
    {
      approvalId: "apr-6034",
      requirement: "Tier-2 approval · orders above $15,000",
      status: "approved",
      source: { system: "Approval service", recordId: "APR-6034" },
      requestedAt: "2026-10-01T10:31:12.730Z",
      decidedAt: "2026-10-01T10:31:12.980Z",
      decidedBy: "Marcus L. (Finance, Tier-2)",
      note: "Within the Q4 category budget.",
      actionIds: ["act-1"],
    },
  ],
  // TRD-22 fixture data. State names mirror the agent_state events; the
  // attempted state "po_creation_requested" is illustrative until the canonical
  // fine-grained state list is confirmed.
  stateTransitions: [
    { eventId: "ev-3", previousState: "request_captured", newState: "approval_pending", policyStage: "PRE_APPROVAL", disposition: "accepted" },
    { eventId: "ev-4", previousState: "approval_pending", newState: "approved", policyStage: "APPROVED", disposition: "accepted" },
    { eventId: "ev-5", previousState: "approved", newState: "po_creation_requested", policyStage: "APPROVED", disposition: "attempted" },
  ],
  delivery: {
    eventId: "ev-7",
    disposition: "unchanged",
    rawCandidate: {
      text: DELIVERED,
      actionRefs: [
        {
          actionId: "act-1",
          claim: "No purchase order was created because the call was not dispatched",
          consistency: "consistent",
        },
      ],
    },
    delivered: {
      text: DELIVERED,
      actionRefs: [
        {
          actionId: "act-1",
          claim: "No purchase order was created because the call was not dispatched",
          consistency: "consistent",
        },
      ],
    },
    interventions: [],
  },
  availableViews: { rag: false, investigation: true },
};

export const procurementNotDispatchedInvestigation: Investigation = {
  traceId: procurementNotDispatchedSummary.traceId,
  applicationName: procurementNotDispatchedSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0007",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "tool_not_dispatched",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.88),
  },
  ruleFindings: policyFindings,
  evaluatorEvidence: evaluators,
  securityFindings: [],
  rca: [
    {
      rank: 1,
      causeId: "agent_workflow",
      explanation:
        "The agent behaved correctly; the gateway rejected the call. Taxonomy v1 has no infrastructure cause, so this is the nearest category and the score is low.",
      evidenceScore: 0.31,
      evidenceEventIds: ["ev-5", "ev-6"],
    },
  ],
  decisionPath: [
    {
      kind: "observation",
      text: "create_purchase_order was authorised by approval APR-6034 but rejected by the tool gateway before dispatch.",
      evidenceEventId: "ev-6",
    },
    {
      kind: "rule",
      text: "approval_required_before_po evaluated: pass.",
      policyId: "PROC-APPROVAL-01",
    },
    {
      kind: "precedence",
      text: "No critical policy or security failure applies, so the trace cannot be BLOCK. The task did not complete, so it cannot be PASS.",
    },
    { kind: "verdict", text: "Final machine decision: REVIEW.", decision: "REVIEW" },
  ],
  decision: "REVIEW",
  reviewHistory: [],
};
