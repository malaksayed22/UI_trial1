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

/** Retrieval succeeded, but the answer adds a claim no document supports. */

const QUERY =
  "What is the reimbursement limit for a business-class flight under the international travel policy?";

const ANSWER =
  "The international travel policy allows business-class airfare reimbursement up to $4,200 for flights over 8 hours, provided pre-approval was obtained [HR-221]. Any excess requires VP sign-off [HR-221], and receipts must be filed within 30 days of return.";

const documents = [
  { documentId: "HR-221", title: "International Travel Policy §4.2", score: 0.94, rank: 1 },
  { documentId: "HR-098", title: "Expense Reporting Guidelines", score: 0.71, rank: 2 },
  { documentId: "FIN-014", title: "Corporate Card Usage Policy", score: 0.58, rank: 3 },
  { documentId: "HR-221b", title: "International Travel Policy §4.3 (approvals)", score: 0.44, rank: 4 },
];

export const ragUnsupportedSummary: TraceSummary = {
  traceId: "trace-2f88b1e0",
  application: "rag-assistant",
  applicationName: "Enterprise RAG Assistant",
  appVersion: RAG_VERSIONS.application,
  startedAt: at("08:12:41"),
  failureLabel: "unsupported_claim",
  decision: "REVIEW",
  policySecurityVerdict: "NOT_APPLICABLE",
};

const evaluators: TraceDetail["evaluators"] = [
  {
    evaluatorId: "eval-retrieval-quality",
    name: "Retrieval quality · Recall@4",
    family: "rag",
    version: "v1.1.0",
    outcome: scored(0.67),
    finding: "2 of 3 expected documents were retrieved; HR-330 §2.1 was not.",
    evidenceEventIds: ["ev-1"],
  },
  {
    evaluatorId: "eval-groundedness",
    name: "Groundedness",
    family: "rag",
    version: "v1.1.0",
    outcome: scored(0.91),
    finding: "Most answer content is supported by retrieved text.",
    evidenceEventIds: ["ev-3"],
  },
  {
    evaluatorId: "eval-citation-support",
    name: "Citation support",
    family: "rag",
    version: "v1.1.0",
    outcome: scored(0.67),
    finding: "1 of 3 claims has no supporting retrieved clause.",
    evidenceEventIds: ["ev-3"],
  },
  {
    evaluatorId: "eval-semantic-completion",
    name: "Semantic judge · unsupported-claim risk",
    family: "semantic",
    version: "v1.0.0",
    outcome: scored(0.81, "lower_is_better"),
    finding:
      "The 30-day receipt-filing requirement does not appear in the retrieved excerpt.",
    evidenceEventIds: ["ev-3"],
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

export const ragUnsupportedDetail: TraceDetail = {
  summary: ragUnsupportedSummary,
  versions: RAG_VERSIONS,
  durationMs: 1473,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T08:12:40.912Z",
      latencyMs: 112,
      query: QUERY,
      retrieverVersion: "retriever-v2.3.1-ada",
      documents,
    },
    {
      eventId: "ev-2",
      parentId: "ev-1",
      sequence: 2,
      type: "model_call",
      timestamp: "2026-10-01T08:12:42.116Z",
      latencyMs: 1204,
      model: "gpt-4.1-mini-v3",
      summary: "Generated a cited answer from the four retrieved documents.",
      tokens: { input: 842, output: 96 },
    },
    {
      eventId: "ev-3",
      parentId: "ev-2",
      sequence: 3,
      type: "final_response",
      timestamp: "2026-10-01T08:12:42.385Z",
      latencyMs: null,
      text: ANSWER,
      flags: ["unsupported_claim"],
    },
  ],
  evaluators,
  policyFindings: [],
  securityFindings: [],
  graph: {
    nodes: [
      { nodeId: "n1", order: 1, kind: "retrieval", label: "Retrieved 4 documents", state: "ok", eventId: "ev-1" },
      { nodeId: "n2", order: 2, kind: "model_call", label: "Answer generated", state: "ok", eventId: "ev-2" },
      { nodeId: "n3", order: 3, kind: "final_response", label: "1 unsupported claim", state: "flagged", eventId: "ev-3" },
    ],
    edges: [
      { from: "n1", to: "n2", relation: "supports" },
      { from: "n2", to: "n3", relation: "sequence" },
      { from: "n3", to: "n1", relation: "unsupported_completion" },
    ],
  },
  availableViews: { rag: true, investigation: true },
};

export const ragUnsupportedDiagnostics: RagDiagnostics = {
  traceId: ragUnsupportedSummary.traceId,
  applicationName: ragUnsupportedSummary.applicationName,
  query: QUERY,
  answer: ANSWER,
  unsupportedClaims: [
    {
      claim: "receipts must be filed within 30 days of return",
      reason: "No matching clause found in the retrieved HR-221 excerpt.",
    },
  ],
  retrieverVersion: RAG_VERSIONS.retriever ?? "n/a",
  evaluatorVersion: "v1.1.0",
  k: 4,
  documents,
  expectedEvidence: [
    { documentRef: "HR-221 §4.2", retrieved: true, rank: 1 },
    { documentRef: "HR-221 §4.3", retrieved: true, rank: 4 },
    { documentRef: "HR-330 §2.1", retrieved: false, rank: null },
  ],
  citations: [
    { claim: "reimbursement up to $4,200", documentId: "HR-221", status: "supported" },
    { claim: "excess requires VP sign-off", documentId: "HR-221", status: "supported" },
    { claim: "receipts must be filed within 30 days of return", documentId: null, status: "unsupported" },
  ],
  metrics: {
    groundedness: scored(0.91),
    citationSupport: scored(0.67),
    recallAtK: scored(0.67),
    meanReciprocalRank: scored(1),
  },
  failureMode: "unsupported_generation",
};

export const ragUnsupportedInvestigation: Investigation = {
  traceId: ragUnsupportedSummary.traceId,
  applicationName: ragUnsupportedSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0008",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "unsupported_claim",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.86),
  },
  ruleFindings: [],
  evaluatorEvidence: evaluators,
  securityFindings: [],
  rca: [
    {
      rank: 1,
      causeId: "model_generation",
      explanation:
        "The model added a receipt-filing requirement absent from every retrieved document.",
      evidenceScore: 0.82,
      evidenceEventIds: ["ev-3"],
    },
    {
      rank: 2,
      causeId: "retrieved_context",
      explanation:
        "Expected evidence HR-330 §2.1 was not in the top-4 retrieved documents.",
      evidenceScore: 0.57,
      evidenceEventIds: ["ev-1"],
    },
    {
      rank: 3,
      causeId: "prompt",
      explanation:
        "The prompt does not instruct the model to abstain on unsupported details.",
      evidenceScore: 0.31,
      evidenceEventIds: ["ev-2"],
    },
  ],
  decisionPath: [
    {
      kind: "observation",
      text: "Citation check found 1 of 3 claims without supporting evidence.",
      evidenceEventId: "ev-3",
    },
    {
      kind: "precedence",
      text: "No critical policy or security failure; an unsupported claim routes the trace to human review.",
    },
    { kind: "verdict", text: "Final machine decision: REVIEW.", decision: "REVIEW" },
  ],
  decision: "REVIEW",
  reviewHistory: [],
};
