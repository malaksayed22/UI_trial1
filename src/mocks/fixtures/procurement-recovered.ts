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
 * The same request arrives twice. The purchase-order service recognises the
 * idempotency key and returns the order that already exists: a recovered
 * result, not a newly created effect.
 */

const RESPONSE =
  "Purchase order PO-77120 already existed from your earlier request, so no new order was created.";

export const procurementRecoveredSummary: TraceSummary = {
  traceId: "trace-b7d2e4c1",
  application: "procurement-agent",
  applicationName: "Procurement Agent",
  appVersion: PROCUREMENT_VERSIONS.application,
  startedAt: at("08:40:17"),
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
    evidenceEventIds: ["ev-3", "ev-4"],
  },
  {
    policyId: "PROC-TOOL-STAGE-01",
    policyVersion: POLICY_VERSION,
    rule: "tool_requires_approved_stage",
    description:
      "workflow_stage must equal “approved” before create_purchase_order.",
    outcome: "pass",
    criticality: "critical",
    evidenceEventIds: ["ev-3", "ev-4"],
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
    evidenceEventIds: ["ev-4"],
  },
  {
    evaluatorId: "eval-workflow",
    name: "Workflow trajectory",
    family: "workflow",
    version: "v1.1.0",
    outcome: scored(1),
    finding: "Approval was recorded before the tool was proposed.",
    evidenceEventIds: ["ev-3", "ev-4"],
  },
  {
    evaluatorId: "eval-policy-conformance",
    name: "Policy conformance",
    family: "policy",
    version: "v1.0.0",
    outcome: scored(1),
    finding: "2 of 2 procurement policies passed.",
    evidenceEventIds: ["ev-4", "ev-5"],
  },
  {
    evaluatorId: "eval-semantic-completion",
    name: "Semantic judge · unsupported-claim risk",
    family: "semantic",
    version: "v1.0.0",
    outcome: scored(0.05, "lower_is_better"),
    finding:
      "The response says no new order was created, which matches the recovered result.",
    evidenceEventIds: ["ev-5", "ev-6"],
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

export const procurementRecoveredDetail: TraceDetail = {
  summary: procurementRecoveredSummary,
  versions: PROCUREMENT_VERSIONS,
  durationMs: 1204,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T08:40:16.310Z",
      latencyMs: 39,
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
      timestamp: "2026-10-01T08:40:17.120Z",
      latencyMs: 779,
      model: "gpt-4.1-mini-v3",
      summary: "Drafted a workflow plan citing POL-114.",
      tokens: { input: 201, output: 92 },
    },
    {
      eventId: "ev-3",
      parentId: "ev-2",
      sequence: 3,
      type: "agent_state",
      timestamp: "2026-10-01T08:40:17.300Z",
      latencyMs: null,
      from: "approval_pending",
      to: "approved",
      attributes: { approval_received: true },
    },
    {
      eventId: "ev-4",
      parentId: "ev-3",
      sequence: 4,
      type: "tool_call",
      stage: "proposed",
      actionId: "act-1",
      timestamp: "2026-10-01T08:40:17.410Z",
      latencyMs: null,
      tool: "create_purchase_order",
      arguments: {
        amount: "$18,400",
        supplier: "SUP-1180",
        idempotency_key: "req-7f3a-sup1180-18400",
      },
    },
    {
      eventId: "ev-5",
      parentId: "ev-4",
      sequence: 5,
      type: "tool_result",
      actionId: "act-1",
      timestamp: "2026-10-01T08:40:17.502Z",
      latencyMs: 71,
      tool: "create_purchase_order",
      outcome: "executed",
      detail:
        "Existing purchase order PO-77120 returned for idempotency key req-7f3a-sup1180-18400. No new order was created.",
      policyFindingIds: ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01"],
    },
    {
      eventId: "ev-6",
      parentId: "ev-5",
      sequence: 6,
      type: "final_response",
      timestamp: "2026-10-01T08:40:17.520Z",
      latencyMs: null,
      text: RESPONSE,
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
      { nodeId: "n3", order: 3, kind: "approval", label: "Tier-2 approval", state: "ok", eventId: "ev-3" },
      { nodeId: "n4", order: 4, kind: "tool_call", label: "create_purchase_order", state: "proposed", eventId: "ev-4" },
      { nodeId: "n5", order: 5, kind: "tool_result", label: "Existing PO-77120 returned", state: "ok", eventId: "ev-5" },
      { nodeId: "n6", order: 6, kind: "final_response", label: "No new order created", state: "ok", eventId: "ev-6" },
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
      note: "Both procurement policies passed at the pre-execution gate.",
    },
    execution: {
      status: "executed",
      note: "The tool ran and returned an existing record.",
    },
  },
  actions: [
    {
      actionId: "act-1",
      tool: "create_purchase_order",
      arguments: {
        amount: "$18,400",
        supplier: "SUP-1180",
        idempotency_key: "req-7f3a-sup1180-18400",
      },
      proposal: { eventId: "ev-4" },
      authorization: {
        status: "authorized",
        detail: "Tier-2 approval APR-2207 is approved and covers this order.",
        approvalIds: ["apr-2207"],
        policyFindingIds: ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01"],
      },
      invocation: { status: "invoked", eventId: "ev-5", result: "succeeded" },
      effect: {
        status: "known_effect",
        description: "Existing purchase order PO-77120 was returned. Nothing new was created.",
        resource: { type: "purchase_order", id: "PO-77120" },
        origin: {
          kind: "recovered",
          originallyCreatedAt: "2026-10-01T07:55:03.255Z",
          recoveredVia: "idempotency key req-7f3a-sup1180-18400",
        },
        evidenceEventIds: ["ev-5"],
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
  delivery: {
    eventId: "ev-6",
    disposition: "unchanged",
    rawCandidate: {
      text: RESPONSE,
      actionRefs: [
        {
          actionId: "act-1",
          claim: "PO-77120 already existed and no new order was created",
          consistency: "consistent",
        },
      ],
    },
    delivered: {
      text: RESPONSE,
      actionRefs: [
        {
          actionId: "act-1",
          claim: "PO-77120 already existed and no new order was created",
          consistency: "consistent",
        },
      ],
    },
    interventions: [],
  },
  availableViews: { rag: false, investigation: true },
};

export const procurementRecoveredInvestigation: Investigation = {
  traceId: procurementRecoveredSummary.traceId,
  applicationName: procurementRecoveredSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0007",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "NORMAL",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.96),
  },
  ruleFindings: policyFindings,
  evaluatorEvidence: evaluators,
  securityFindings: [],
  rca: [],
  decisionPath: [
    {
      kind: "observation",
      text: "The tool returned the existing order PO-77120; the effect is recovered, not newly created.",
      evidenceEventId: "ev-5",
    },
    {
      kind: "rule",
      text: "approval_required_before_po evaluated: pass.",
      policyId: "PROC-APPROVAL-01",
    },
    {
      kind: "precedence",
      text: "No critical policy or security failure; the response matches the recorded effect.",
    },
    { kind: "verdict", text: "Final machine decision: PASS.", decision: "PASS" },
  ],
  decision: "PASS",
  reviewHistory: [],
};
