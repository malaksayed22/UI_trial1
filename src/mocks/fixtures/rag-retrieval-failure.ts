import type {
  Investigation,
  RagDiagnostics,
  TraceDetail,
  TraceSummary,
} from "@/types";
import {
  at,
  evaluatorFailed,
  EVALUATOR_SET_VERSION,
  notApplicable,
  RAG_VERSIONS,
  scored,
} from "./shared";

/**
 * Retrieval missed the expected evidence. The semantic judge also failed, so
 * the evaluation is incomplete and the trace cannot resolve to PASS.
 */

const QUERY = "What is the domestic per-diem meal allowance?";

const ANSWER =
  "The domestic meal allowance is $65 per day, claimed through the corporate card program [FIN-014].";

const documents = [
  { documentId: "HR-310", title: "Remote Work Equipment Policy", score: 0.52, rank: 1 },
  { documentId: "FIN-014", title: "Corporate Card Usage Policy", score: 0.49, rank: 2 },
  { documentId: "HR-098", title: "Expense Reporting Guidelines", score: 0.47, rank: 3 },
  { documentId: "IT-077", title: "Device Security Baseline", score: 0.41, rank: 4 },
];

export const ragRetrievalFailureSummary: TraceSummary = {
  traceId: "trace-6c41d9f2",
  application: "rag-assistant",
  applicationName: "Enterprise RAG Assistant",
  appVersion: RAG_VERSIONS.application,
  startedAt: at("06:30:18"),
  failureLabel: "retrieval_failure",
  decision: "REVIEW",
  policySecurityVerdict: "NOT_APPLICABLE",
};

const evaluators: TraceDetail["evaluators"] = [
  {
    evaluatorId: "eval-retrieval-quality",
    name: "Retrieval quality · Recall@4",
    family: "rag",
    version: "v1.1.0",
    outcome: scored(0),
    finding: "Neither expected document was retrieved.",
    evidenceEventIds: ["ev-1"],
  },
  {
    evaluatorId: "eval-groundedness",
    name: "Groundedness",
    family: "rag",
    version: "v1.1.0",
    outcome: scored(0.34),
    finding: "The stated allowance is not present in retrieved text.",
    evidenceEventIds: ["ev-3"],
  },
  {
    evaluatorId: "eval-citation-support",
    name: "Citation support",
    family: "rag",
    version: "v1.1.0",
    outcome: scored(0),
    finding: "The cited document FIN-014 does not state an allowance.",
    evidenceEventIds: ["ev-3"],
  },
  {
    evaluatorId: "eval-semantic-completion",
    name: "Semantic judge · unsupported-claim risk",
    family: "semantic",
    version: "v1.0.0",
    outcome: evaluatorFailed("Judge request timed out after 30 s."),
    finding: null,
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
    outcome: { status: "not_evaluated" },
    finding: null,
    evidenceEventIds: [],
  },
];

export const ragRetrievalFailureDetail: TraceDetail = {
  summary: ragRetrievalFailureSummary,
  versions: RAG_VERSIONS,
  durationMs: 1290,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T06:30:17.402Z",
      latencyMs: 97,
      query: QUERY,
      retrieverVersion: "retriever-v2.3.1-ada",
      documents,
    },
    {
      eventId: "ev-2",
      parentId: "ev-1",
      sequence: 2,
      type: "model_call",
      timestamp: "2026-10-01T06:30:18.440Z",
      latencyMs: 938,
      model: "gpt-4.1-mini-v3",
      summary: "Generated an answer from low-relevance documents.",
      // Token usage was not recorded for this call.
      tokens: null,
    },
    {
      eventId: "ev-3",
      parentId: "ev-2",
      sequence: 3,
      type: "final_response",
      timestamp: "2026-10-01T06:30:18.692Z",
      latencyMs: null,
      text: ANSWER,
      flags: ["unsupported_claim", "retrieval_failure"],
    },
  ],
  evaluators,
  policyFindings: [],
  securityFindings: [],
  graph: {
    nodes: [
      { nodeId: "n1", order: 1, kind: "retrieval", label: "Expected evidence missed", state: "flagged", eventId: "ev-1" },
      { nodeId: "n2", order: 2, kind: "model_call", label: "Answer generated", state: "ok", eventId: "ev-2" },
      { nodeId: "n3", order: 3, kind: "final_response", label: "Unsupported answer", state: "flagged", eventId: "ev-3" },
    ],
    edges: [
      { from: "n1", to: "n2", relation: "supports" },
      { from: "n2", to: "n3", relation: "sequence" },
      { from: "n3", to: "n1", relation: "unsupported_completion" },
    ],
  },
  availableViews: { rag: true, investigation: true },
};

export const ragRetrievalFailureDiagnostics: RagDiagnostics = {
  traceId: ragRetrievalFailureSummary.traceId,
  applicationName: ragRetrievalFailureSummary.applicationName,
  query: QUERY,
  answer: ANSWER,
  unsupportedClaims: [
    {
      claim: "The domestic meal allowance is $65 per day",
      reason: "No retrieved document states a domestic meal allowance.",
    },
  ],
  retrieverVersion: RAG_VERSIONS.retriever ?? "n/a",
  evaluatorVersion: "v1.1.0",
  k: 4,
  documents,
  expectedEvidence: [
    { documentRef: "HR-221 §5.1", retrieved: false, rank: null },
    { documentRef: "HR-221 §5.2", retrieved: false, rank: null },
  ],
  citations: [
    {
      claim: "domestic meal allowance is $65 per day",
      documentId: "FIN-014",
      status: "unsupported",
    },
  ],
  metrics: {
    groundedness: scored(0.34),
    citationSupport: scored(0),
    recallAtK: scored(0),
    meanReciprocalRank: scored(0),
  },
  failureMode: "retrieval_failure",
};

export const ragRetrievalFailureInvestigation: Investigation = {
  traceId: ragRetrievalFailureSummary.traceId,
  applicationName: ragRetrievalFailureSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0008",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "retrieval_failure",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.79),
  },
  ruleFindings: [],
  evaluatorEvidence: evaluators,
  securityFindings: [],
  rca: [
    {
      rank: 1,
      causeId: "retriever",
      explanation:
        "None of the expected HR-221 sections ranked in the top 4 (Recall@4 = 0).",
      evidenceScore: 0.88,
      evidenceEventIds: ["ev-1"],
    },
    {
      rank: 2,
      causeId: "retrieved_context",
      explanation:
        "The retrieved documents were low-relevance (top score 0.52).",
      evidenceScore: 0.66,
      evidenceEventIds: ["ev-1"],
    },
    {
      rank: 3,
      causeId: "prompt",
      explanation:
        "The prompt did not require abstention when evidence is weak.",
      evidenceScore: 0.29,
      evidenceEventIds: ["ev-2"],
    },
  ],
  decisionPath: [
    {
      kind: "observation",
      text: "Neither expected document was retrieved (Recall@4 = 0).",
      evidenceEventId: "ev-1",
    },
    {
      kind: "precedence",
      text: "The semantic judge failed, so evaluation is incomplete and the trace cannot resolve to PASS.",
    },
    { kind: "verdict", text: "Final machine decision: REVIEW.", decision: "REVIEW" },
  ],
  decision: "REVIEW",
  reviewHistory: [],
};
