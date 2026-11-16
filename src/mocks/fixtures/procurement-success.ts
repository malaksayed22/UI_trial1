import type { Investigation, TraceDetail, TraceSummary } from "@/types";
import {
  at,
  EVALUATOR_SET_VERSION,
  notApplicable,
  POLICY_VERSION,
  PROCUREMENT_VERSIONS,
  scored,
} from "./shared";

/** Valid procurement trajectory: approval recorded, tool executed. */

export const procurementSuccessSummary: TraceSummary = {
  traceId: "trace-9a03e771",
  application: "procurement-agent",
  applicationName: "Procurement Agent",
  appVersion: PROCUREMENT_VERSIONS.application,
  startedAt: at("07:55:02"),
  failureLabel: "NORMAL",
  decision: "PASS",
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
    description: "SUP-1180 is an approved supplier at this order value.",
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
    outcome: scored(1),
    finding: "Approval was recorded before the tool was proposed.",
    evidenceEventIds: ["ev-4", "ev-5"],
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
    outcome: scored(0.06, "lower_is_better"),
    finding: "Completion claim matches the executed tool result.",
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

export const procurementSuccessDetail: TraceDetail = {
  summary: procurementSuccessSummary,
  versions: PROCUREMENT_VERSIONS,
  durationMs: 1431,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T07:55:01.870Z",
      latencyMs: 41,
      query: "Purchase approval threshold for an $18,400 order",
      retrieverVersion: "retriever-v2.3.1-ada",
      documents: [
        {
          documentId: "POL-114",
          version: "v4",
          title: "Purchase approval threshold, Tier 2",
          score: 0.93,
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
      timestamp: "2026-10-01T07:55:02.742Z",
      latencyMs: 801,
      model: "gpt-4.1-mini-v3",
      summary: "Drafted a workflow plan citing POL-114.",
      tokens: { input: 204, output: 96 },
    },
    {
      eventId: "ev-3",
      parentId: "ev-2",
      sequence: 3,
      type: "agent_state",
      timestamp: "2026-10-01T07:55:02.760Z",
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
      timestamp: "2026-10-01T07:55:03.020Z",
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
      timestamp: "2026-10-01T07:55:03.140Z",
      latencyMs: null,
      tool: "create_purchase_order",
      arguments: { amount: "$18,400", supplier: "SUP-1180" },
    },
    {
      eventId: "ev-6",
      parentId: "ev-5",
      sequence: 6,
      type: "tool_result",
      actionId: "act-1",
      timestamp: "2026-10-01T07:55:03.255Z",
      latencyMs: 98,
      tool: "create_purchase_order",
      outcome: "executed",
      detail: "Mock purchase order PO-77120 created.",
      policyFindingIds: [
        "PROC-APPROVAL-01",
        "PROC-TOOL-STAGE-01",
        "PROC-SUPPLIER-01",
      ],
    },
    {
      eventId: "ev-7",
      parentId: "ev-6",
      sequence: 7,
      type: "final_response",
      timestamp: "2026-10-01T07:55:03.301Z",
      latencyMs: null,
      text: "Purchase order PO-77120 was created after Tier-2 approval.",
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
      { nodeId: "n5", order: 5, kind: "tool_result", label: "Tool executed", state: "ok", eventId: "ev-6" },
      { nodeId: "n6", order: 6, kind: "final_response", label: "PO-77120 confirmed", state: "ok", eventId: "ev-7" },
    ],
    edges: [
      { from: "n1", to: "n2", relation: "supports" },
      { from: "n2", to: "n3", relation: "sequence" },
      { from: "n3", to: "n4", relation: "sequence" },
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
        actionVerdict: "ALLOW",
        verdictBasis: "ALL_APPLICABLE_PASSED",
        verdictExplanation:
          "All three evaluated procurement policies passed before dispatch.",
        evaluatedPolicies: [
          { policyId: "PROC-APPROVAL-01", policyResult: "PASS" },
          { policyId: "PROC-TOOL-STAGE-01", policyResult: "PASS" },
          { policyId: "PROC-SUPPLIER-01", policyResult: "PASS" },
        ],
      },
    },
    execution: {
      status: "executed",
      note: "create_purchase_order ran and returned a confirmed result.",
    },
  },
  actions: [
    {
      actionId: "act-1",
      tool: "create_purchase_order",
      arguments: { amount: "$18,400", supplier: "SUP-1180" },
      proposal: { eventId: "ev-5" },
      authorization: {
        status: "authorized",
        detail: "Tier-2 approval APR-2207 was approved before the tool was proposed.",
        approvalIds: ["apr-2207"],
        policyFindingIds: ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01", "PROC-SUPPLIER-01"],
      },
      invocation: { status: "invoked", eventId: "ev-6", result: "succeeded" },
      effect: {
        status: "known_effect",
        description: "Purchase order PO-77120 was created.",
        resource: { type: "purchase_order", id: "PO-77120" },
        origin: { kind: "created", createdAt: "2026-10-01T07:55:03.255Z" },
        evidenceEventIds: ["ev-6"],
      },
      stageAtBoundaries: {
        policyStageAtProposal: "APPROVED",
        checkedPolicyStage: "APPROVED",
        policyStageAtDispatch: "PO_CREATION",
        policyStage: "COMPLETED",
      },
    },
  ],
  approvals: [
    {
      approvalId: "apr-2207",
      requirement: "Tier-2 approval · orders above $15,000",
      status: "approved",
      source: { system: "Approval service", recordId: "APR-2207" },
      requestedAt: "2026-10-01T07:55:02.790Z",
      decidedAt: "2026-10-01T07:55:03.020Z",
      decidedBy: "Marcus L. (Finance, Tier-2)",
      note: "Within the Q4 category budget.",
      actionIds: ["act-1"],
    },
  ],
  // TRD-22 fixture data. State names mirror the agent_state events; the
  // attempted state "po_creation_requested" is illustrative until the canonical
  // fine-grained state list is confirmed.
  stateTransitions: [
    { eventId: "ev-3", previousState: "request_captured", newState: "policy_checked", policyStage: "PRE_APPROVAL", disposition: "accepted" },
    { eventId: "ev-4", previousState: "approval_pending", newState: "approved", policyStage: "APPROVED", disposition: "accepted" },
    { eventId: "ev-5", previousState: "approved", newState: "po_creation_requested", policyStage: "PO_CREATION", disposition: "accepted" },
  ],
  delivery: {
    eventId: "ev-7",
    disposition: "unchanged",
    rawCandidate: {
      text: "Purchase order PO-77120 was created after Tier-2 approval.",
      actionRefs: [
        {
          actionId: "act-1",
          claim: "PO-77120 was created",
          consistency: "consistent",
        },
      ],
    },
    delivered: {
      text: "Purchase order PO-77120 was created after Tier-2 approval.",
      actionRefs: [
        {
          actionId: "act-1",
          claim: "PO-77120 was created",
          consistency: "consistent",
        },
      ],
    },
    interventions: [],
  },
  availableViews: { rag: false, investigation: true },
};

export const procurementSuccessInvestigation: Investigation = {
  traceId: procurementSuccessSummary.traceId,
  applicationName: procurementSuccessSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0007",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "NORMAL",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.97),
  },
  ruleFindings: policyFindings,
  evaluatorEvidence: evaluators,
  securityFindings: [],
  rca: [],
  decisionPath: [
    {
      kind: "observation",
      text: "Approval was recorded in state approved before the tool was proposed.",
      evidenceEventId: "ev-4",
    },
    {
      kind: "rule",
      text: "approval_required_before_po evaluated: pass.",
      policyId: "PROC-APPROVAL-01",
    },
    {
      kind: "precedence",
      text: "No critical policy or security failure; all metrics are within tolerance.",
    },
    { kind: "verdict", text: "Final machine decision: PASS.", decision: "PASS" },
  ],
  decision: "PASS",
  reviewHistory: [],
};
