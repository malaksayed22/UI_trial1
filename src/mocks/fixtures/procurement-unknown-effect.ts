import type { Investigation, TraceDetail, TraceSummary } from "@/types";
import {
  at,
  evaluatorFailed,
  EVALUATOR_SET_VERSION,
  notApplicable,
  POLICY_VERSION,
  PROCUREMENT_VERSIONS,
  scored,
} from "./shared";

/**
 * The tool was authorised and dispatched, but no confirmation came back. The
 * side effect is UNKNOWN: it is neither a success nor a confirmed no-op. The
 * model's raw candidate claimed success and was withheld.
 */

const RAW_CANDIDATE = "Purchase order created successfully.";
const DELIVERED =
  "I could not confirm whether the purchase order was created. Please check the purchase-order register before resubmitting; a reviewer has been notified.";

export const procurementUnknownSummary: TraceSummary = {
  traceId: "trace-c35e8a90",
  application: "procurement-agent",
  applicationName: "Procurement Agent",
  appVersion: PROCUREMENT_VERSIONS.application,
  startedAt: at("08:58:44"),
  failureLabel: "unknown_side_effect",
  decision: "REVIEW",
  policySecurityVerdict: "UNAVAILABLE",
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
    finding: "2 of 2 procurement policies passed.",
    evidenceEventIds: ["ev-5", "ev-6"],
  },
  {
    evaluatorId: "eval-semantic-completion",
    name: "Semantic judge · unsupported-claim risk",
    family: "semantic",
    version: "v1.0.0",
    outcome: scored(0.09, "lower_is_better"),
    finding:
      "The delivered response makes no completion claim. The raw candidate did, and was withheld.",
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
    outcome: evaluatorFailed("Security scanner returned HTTP 503."),
    finding: null,
    evidenceEventIds: [],
  },
];

export const procurementUnknownDetail: TraceDetail = {
  summary: procurementUnknownSummary,
  versions: PROCUREMENT_VERSIONS,
  durationMs: 31906,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T08:58:41.002Z",
      latencyMs: 44,
      query: "Purchase approval threshold for a $31,750 order",
      retrieverVersion: "retriever-v2.3.1-ada",
      documents: [
        {
          documentId: "POL-114",
          version: "v4",
          title: "Purchase approval threshold, Tier 2",
          score: 0.92,
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
      timestamp: "2026-10-01T08:58:41.910Z",
      latencyMs: 842,
      model: "gpt-4.1-mini-v3",
      summary: "Drafted a workflow plan citing POL-114.",
      tokens: { input: 207, output: 98 },
    },
    {
      eventId: "ev-3",
      parentId: "ev-2",
      sequence: 3,
      type: "agent_state",
      timestamp: "2026-10-01T08:58:41.960Z",
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
      timestamp: "2026-10-01T08:58:42.480Z",
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
      timestamp: "2026-10-01T08:58:42.590Z",
      latencyMs: null,
      tool: "create_purchase_order",
      arguments: {
        amount: "$31,750",
        supplier: "SUP-1180",
        idempotency_key: "req-c35e-sup1180-31750",
      },
    },
    {
      eventId: "ev-6",
      parentId: "ev-5",
      sequence: 6,
      type: "tool_result",
      actionId: "act-1",
      timestamp: "2026-10-01T08:59:12.640Z",
      latencyMs: 30050,
      tool: "create_purchase_order",
      outcome: "unconfirmed",
      detail:
        "The call was dispatched but the purchase-order service returned no confirmation before the 30 s timeout. A follow-up lookup also timed out.",
      policyFindingIds: ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01"],
    },
    {
      eventId: "ev-7",
      parentId: "ev-6",
      sequence: 7,
      type: "final_response",
      timestamp: "2026-10-01T08:59:12.908Z",
      latencyMs: null,
      text: DELIVERED,
      flags: ["unconfirmed_outcome"],
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
      { nodeId: "n5", order: 5, kind: "tool_result", label: "Outcome unconfirmed", state: "flagged", eventId: "ev-6" },
      { nodeId: "n6", order: 6, kind: "final_response", label: "Candidate withheld", state: "ok", eventId: "ev-7" },
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
      note: "The current Tier-2 approval was recorded before the tool was proposed.",
    },
    policy: {
      stage: "gate_passed",
      note: "Both procurement policies passed at the pre-execution gate.",
    },
    execution: {
      status: "outcome_unknown",
      note: "The call was dispatched. No confirmation or lookup result came back.",
    },
  },
  actions: [
    {
      actionId: "act-1",
      tool: "create_purchase_order",
      arguments: {
        amount: "$31,750",
        supplier: "SUP-1180",
        idempotency_key: "req-c35e-sup1180-31750",
      },
      proposal: { eventId: "ev-5" },
      authorization: {
        status: "authorized",
        detail: "Tier-2 approval APR-4415 is approved and covers this order.",
        approvalIds: ["apr-4415"],
        policyFindingIds: ["PROC-APPROVAL-01", "PROC-TOOL-STAGE-01"],
      },
      invocation: { status: "invoked", eventId: "ev-6", result: "unconfirmed" },
      effect: {
        status: "unknown",
        reason:
          "No confirmation arrived and the follow-up lookup timed out, so it is not known whether a purchase order was created.",
        evidenceEventIds: ["ev-6"],
      },
    },
  ],
  approvals: [
    {
      approvalId: "apr-4415",
      requirement: "Tier-2 approval · orders above $25,000",
      status: "approved",
      source: { system: "Approval service", recordId: "APR-4415" },
      requestedAt: "2026-10-01T08:58:41.960Z",
      decidedAt: "2026-10-01T08:58:42.480Z",
      decidedBy: "Marcus L. (Finance, Tier-2)",
      note: "Approved at the revised amount of $31,750.",
      actionIds: ["act-1"],
    },
    {
      approvalId: "apr-4410",
      requirement: "Tier-2 approval · orders above $25,000",
      status: "cancelled",
      source: { system: "Approval service", recordId: "APR-4410" },
      requestedAt: "2026-10-01T08:52:10.000Z",
      decidedAt: "2026-10-01T08:58:30.000Z",
      decidedBy: "Requester",
      note: "Cancelled by the requester: order amount revised from $29,900 to $31,750.",
      actionIds: [],
    },
  ],
  delivery: {
    eventId: "ev-7",
    disposition: "suppressed",
    rawCandidate: {
      text: RAW_CANDIDATE,
      actionRefs: [
        {
          actionId: "act-1",
          claim: "The purchase order was created",
          consistency: "unverified",
        },
      ],
    },
    delivered: {
      text: DELIVERED,
      actionRefs: [
        {
          actionId: "act-1",
          claim: "The outcome could not be confirmed",
          consistency: "consistent",
        },
      ],
    },
    interventions: [
      {
        reason:
          "The candidate asserted a completion that the action record cannot confirm. It was withheld and replaced with a fixed unconfirmed-outcome notice.",
        policyFindingIds: [],
        evidenceEventIds: ["ev-6"],
      },
    ],
  },
  availableViews: { rag: false, investigation: true },
};

export const procurementUnknownInvestigation: Investigation = {
  traceId: procurementUnknownSummary.traceId,
  applicationName: procurementUnknownSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0007",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "unknown_side_effect",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.84),
  },
  ruleFindings: policyFindings,
  evaluatorEvidence: evaluators,
  securityFindings: [],
  rca: [
    {
      rank: 1,
      causeId: "agent_workflow",
      explanation:
        "The workflow has no read-back step after an unconfirmed tool result, so the effect stayed unknown.",
      evidenceScore: 0.58,
      evidenceEventIds: ["ev-6"],
    },
  ],
  decisionPath: [
    {
      kind: "observation",
      text: "create_purchase_order was dispatched and returned no confirmation; the side effect is unknown.",
      evidenceEventId: "ev-6",
    },
    {
      kind: "precedence",
      text: "An unknown effect is neither a success nor a no-op, and the security scanner was unavailable, so the trace cannot resolve to PASS.",
    },
    { kind: "verdict", text: "Final machine decision: REVIEW.", decision: "REVIEW" },
  ],
  decision: "REVIEW",
  reviewHistory: [],
};
