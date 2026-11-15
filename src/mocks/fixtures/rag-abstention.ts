import type {
  Investigation,
  RagDiagnostics,
  TraceDetail,
  TraceSummary,
} from "@/types";
import {
  at,
  EVALUATOR_SET_VERSION,
  notApplicable,
  RAG_VERSIONS,
  scored,
} from "./shared";

/**
 * The question is outside the corpus. The assistant abstained on purpose:
 * this is a decision the system made, not a fault, and it is a valid answer.
 */

const QUERY =
  "What is the policy on reimbursing rideshare trips taken on personal days?";

const ANSWER =
  "I could not find a policy that covers rideshare reimbursement on personal days, so I can't answer this reliably. Please contact the Travel Desk.";

const documents = [
  { documentId: "HR-221", version: "v6", title: "International Travel Policy §4.2", score: 0.41, rank: 1 },
  { documentId: "HR-098", version: "v3", title: "Expense Reporting Guidelines", score: 0.38, rank: 2 },
  { documentId: "FIN-014", version: "v5", title: "Corporate Card Usage Policy", score: 0.33, rank: 3 },
  { documentId: "HR-310", version: "v2", title: "Remote Work Equipment Policy", score: 0.29, rank: 4 },
];

export const ragAbstentionSummary: TraceSummary = {
  traceId: "trace-e5a7c302",
  application: "rag-assistant",
  applicationName: "Enterprise RAG Assistant",
  appVersion: RAG_VERSIONS.application,
  startedAt: at("07:20:09"),
  failureLabel: "NORMAL",
  decision: "PASS",
  policySecurityVerdict: "NOT_APPLICABLE",
};

const evaluators: TraceDetail["evaluators"] = [
  {
    evaluatorId: "eval-retrieval-quality",
    name: "Retrieval quality · Recall@4",
    family: "rag",
    version: "v1.1.0",
    outcome: notApplicable("No expected evidence: the question is outside the corpus."),
    finding: null,
    evidenceEventIds: ["ev-1"],
  },
  {
    evaluatorId: "eval-groundedness",
    name: "Groundedness",
    family: "rag",
    version: "v1.1.0",
    outcome: notApplicable("The assistant abstained, so there are no claims to ground."),
    finding: null,
    evidenceEventIds: ["ev-3"],
  },
  {
    evaluatorId: "eval-abstention",
    name: "Abstention appropriateness",
    family: "semantic",
    version: "v1.0.0",
    outcome: scored(0.96),
    finding:
      "No retrieved document addresses the question, so abstaining was the correct response.",
    evidenceEventIds: ["ev-1", "ev-3"],
  },
  {
    evaluatorId: "eval-policy-conformance",
    name: "Policy conformance",
    family: "policy",
    version: "v1.0.0",
    outcome: notApplicable("Procurement policies do not apply to RAG traces."),
    finding: null,
    evidenceEventIds: [],
  },
  {
    evaluatorId: "eval-prompt-injection",
    name: "Prompt-injection detector",
    family: "security",
    version: "v1.0.0",
    outcome: scored(0.02, "lower_is_better"),
    finding: "No injection pattern detected in query or retrieved content.",
    evidenceEventIds: [],
  },
];

export const ragAbstentionDetail: TraceDetail = {
  summary: ragAbstentionSummary,
  versions: RAG_VERSIONS,
  durationMs: 903,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T07:20:08.530Z",
      latencyMs: 101,
      query: QUERY,
      retrieverVersion: "retriever-v2.3.1-ada",
      documents,
      failure: null,
    },
    {
      eventId: "ev-2",
      parentId: "ev-1",
      sequence: 2,
      type: "model_call",
      timestamp: "2026-10-01T07:20:09.310Z",
      latencyMs: 701,
      model: "gpt-4.1-mini-v3",
      summary: "Declined to answer: the best retrieval score was below the answer threshold.",
      tokens: { input: 611, output: 38 },
    },
    {
      eventId: "ev-3",
      parentId: "ev-2",
      sequence: 3,
      type: "final_response",
      timestamp: "2026-10-01T07:20:09.433Z",
      latencyMs: null,
      text: ANSWER,
      flags: [],
    },
  ],
  evaluators,
  policyFindings: [],
  securityFindings: [],
  graph: {
    nodes: [
      { nodeId: "n1", order: 1, kind: "retrieval", label: "Retrieved 4 weak matches", state: "ok", eventId: "ev-1" },
      { nodeId: "n2", order: 2, kind: "model_call", label: "Abstained", state: "ok", eventId: "ev-2" },
      { nodeId: "n3", order: 3, kind: "final_response", label: "Abstention delivered", state: "ok", eventId: "ev-3" },
    ],
    edges: [
      { from: "n1", to: "n2", relation: "supports" },
      { from: "n2", to: "n3", relation: "sequence" },
    ],
  },
  status: {
    workflow: {
      state: "abstained",
      note: "The assistant chose not to answer.",
    },
    policy: {
      stage: "not_applicable",
      note: "Procurement policies do not apply to RAG traces.",
    },
    execution: {
      status: "not_applicable",
      note: "No tool was proposed or invoked.",
    },
  },
  actions: [],
  approvals: [],
  delivery: {
    eventId: "ev-3",
    disposition: "unchanged",
    rawCandidate: { text: ANSWER, actionRefs: [] },
    delivered: { text: ANSWER, actionRefs: [] },
    interventions: [],
  },
  availableViews: { rag: true, investigation: true },
};

export const ragAbstentionDiagnostics: RagDiagnostics = {
  traceId: ragAbstentionSummary.traceId,
  applicationName: ragAbstentionSummary.applicationName,
  query: QUERY,
  answer: ANSWER,
  outcome: {
    kind: "abstained",
    reason:
      "The best retrieval score (0.41) is below the 0.60 answer threshold and no retrieved passage addresses the question.",
  },
  retrieverVersion: RAG_VERSIONS.retriever ?? "n/a",
  evaluatorVersion: "v1.1.0",
  k: 4,
  documents,
  expectedEvidence: [],
  sources: [],
  claims: [],
  metrics: {
    groundedness: notApplicable("The assistant abstained, so there are no claims to ground."),
    citationSupport: notApplicable("The assistant abstained, so there are no claims to cite."),
    recallAtK: notApplicable("No expected evidence: the question is outside the corpus."),
    meanReciprocalRank: notApplicable("No expected evidence: the question is outside the corpus."),
  },
  failureMode: "none",
};

export const ragAbstentionInvestigation: Investigation = {
  traceId: ragAbstentionSummary.traceId,
  applicationName: ragAbstentionSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0008",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "NORMAL",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.95),
  },
  ruleFindings: [],
  evaluatorEvidence: evaluators,
  securityFindings: [],
  rca: [],
  decisionPath: [
    {
      kind: "observation",
      text: "The assistant abstained; the best retrieval score of 0.41 is below the answer threshold.",
      evidenceEventId: "ev-1",
    },
    {
      kind: "precedence",
      text: "An abstention on out-of-corpus questions is a valid, safe response. It is not a failure.",
    },
    { kind: "verdict", text: "Final machine decision: PASS.", decision: "PASS" },
  ],
  decision: "PASS",
  reviewHistory: [],
};
