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
 * The retrieval provider timed out. This is an infrastructure fault, not a
 * retrieval-quality result and not an abstention: the model never ran, so
 * nothing about answer quality can be concluded.
 */

const QUERY = "What is the notice period for terminating a vendor contract early?";

const FALLBACK =
  "I can't answer right now because document search is temporarily unavailable. Please try again shortly.";

export const ragProviderFailureSummary: TraceSummary = {
  traceId: "trace-f9b1d7a4",
  application: "rag-assistant",
  applicationName: "Enterprise RAG Assistant",
  appVersion: RAG_VERSIONS.application,
  startedAt: at("06:58:51"),
  failureLabel: "provider_failure",
  decision: "REVIEW",
  policySecurityVerdict: "NOT_APPLICABLE",
};

const evaluators: TraceDetail["evaluators"] = [
  {
    evaluatorId: "eval-retrieval-quality",
    name: "Retrieval quality · Recall@4",
    family: "rag",
    version: "v1.1.0",
    outcome: { status: "not_evaluated" },
    finding: null,
    evidenceEventIds: ["ev-1"],
  },
  {
    evaluatorId: "eval-groundedness",
    name: "Groundedness",
    family: "rag",
    version: "v1.1.0",
    outcome: notApplicable("No answer was generated."),
    finding: null,
    evidenceEventIds: [],
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
    outcome: scored(0.01, "lower_is_better"),
    finding: "No injection pattern detected in the query.",
    evidenceEventIds: [],
  },
];

export const ragProviderFailureDetail: TraceDetail = {
  summary: ragProviderFailureSummary,
  versions: RAG_VERSIONS,
  durationMs: 30214,
  events: [
    {
      eventId: "ev-1",
      parentId: null,
      sequence: 1,
      type: "retrieval",
      timestamp: "2026-10-01T06:58:21.040Z",
      latencyMs: 30000,
      query: QUERY,
      retrieverVersion: "retriever-v2.3.1-ada",
      documents: [],
      failure: {
        code: "UPSTREAM_TIMEOUT",
        message: "Vector store pgvector-prod did not respond within 30 s after 3 attempts.",
      },
    },
    {
      eventId: "ev-2",
      parentId: "ev-1",
      sequence: 2,
      type: "final_response",
      timestamp: "2026-10-01T06:58:51.254Z",
      latencyMs: null,
      text: FALLBACK,
      flags: ["provider_failure"],
    },
  ],
  evaluators,
  policyFindings: [],
  securityFindings: [],
  graph: {
    nodes: [
      { nodeId: "n1", order: 1, kind: "retrieval", label: "Retrieval provider timed out", state: "flagged", eventId: "ev-1" },
      { nodeId: "n2", order: 2, kind: "final_response", label: "Fallback notice sent", state: "ok", eventId: "ev-2" },
    ],
    edges: [{ from: "n1", to: "n2", relation: "sequence" }],
  },
  status: {
    workflow: {
      state: "retrieval_failed",
      note: "The workflow stopped at retrieval; the model was never called.",
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
    eventId: "ev-2",
    disposition: "no_candidate",
    rawCandidate: null,
    delivered: { text: FALLBACK, actionRefs: [] },
    interventions: [],
  },
  availableViews: { rag: true, investigation: true },
};

export const ragProviderFailureDiagnostics: RagDiagnostics = {
  traceId: ragProviderFailureSummary.traceId,
  applicationName: ragProviderFailureSummary.applicationName,
  query: QUERY,
  answer: null,
  outcome: {
    kind: "technical_failure",
    stage: "retrieval",
    provider: "pgvector-prod",
    code: "UPSTREAM_TIMEOUT",
    message: "Vector store pgvector-prod did not respond within 30 s after 3 attempts.",
    retryable: true,
  },
  retrieverVersion: RAG_VERSIONS.retriever ?? "n/a",
  evaluatorVersion: "v1.1.0",
  k: 4,
  documents: [],
  expectedEvidence: [],
  sources: [],
  claims: [],
  metrics: {
    groundedness: { status: "not_evaluated" },
    citationSupport: { status: "not_evaluated" },
    recallAtK: { status: "not_evaluated" },
    meanReciprocalRank: { status: "not_evaluated" },
  },
  failureMode: "technical_failure",
};

export const ragProviderFailureInvestigation: Investigation = {
  traceId: ragProviderFailureSummary.traceId,
  applicationName: ragProviderFailureSummary.applicationName,
  provenance: {
    runId: "run-2026-1001-0008",
    evaluatorSetVersion: EVALUATOR_SET_VERSION,
    datasetVersion: null,
  },
  primaryLabel: "provider_failure",
  classifier: {
    kind: "xgboost",
    version: "clf-xgb-v1.2.0",
    score: scored(0.9),
  },
  ruleFindings: [],
  evaluatorEvidence: evaluators,
  securityFindings: [],
  rca: [
    {
      rank: 1,
      causeId: "retriever",
      explanation:
        "The retrieval provider timed out on every attempt; no documents were returned.",
      evidenceScore: 0.93,
      evidenceEventIds: ["ev-1"],
    },
  ],
  decisionPath: [
    {
      kind: "observation",
      text: "Retrieval failed with UPSTREAM_TIMEOUT; the model was never called.",
      evidenceEventId: "ev-1",
    },
    {
      kind: "precedence",
      text: "A provider fault says nothing about answer quality. Evaluation could not run, so the trace cannot resolve to PASS.",
    },
    { kind: "verdict", text: "Final machine decision: REVIEW.", decision: "REVIEW" },
  ],
  decision: "REVIEW",
  reviewHistory: [],
};
