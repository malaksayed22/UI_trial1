import type { Decision, Measurement, Provenance } from "./common";
import type {
  DecisionStep,
  PolicyFinding,
  ReviewEntry,
  SecurityFinding,
} from "./governance";
import type { RetrievedDocument } from "./trace";

export type EvaluatorFamily =
  | "deterministic"
  | "rag"
  | "semantic"
  | "workflow"
  | "security"
  | "policy";

/** One evaluator output. Semantic/LLM evaluators are fallible evidence. */
export type EvaluatorResult = {
  evaluatorId: string;
  name: string;
  family: EvaluatorFamily;
  version: string;
  outcome: Measurement;
  finding: string | null;
  evidenceEventIds: string[];
};

export type RagFailureMode =
  | "none"
  | "retrieval_failure"
  | "weak_context"
  | "unsupported_generation";

export type ExpectedEvidence = {
  documentRef: string;
  retrieved: boolean;
  rank: number | null;
};

export type CitationCheck = {
  claim: string;
  documentId: string | null;
  status: "supported" | "unsupported";
};

export type RagDiagnostics = {
  traceId: string;
  applicationName: string;
  query: string;
  answer: string;
  /** Substrings of `answer` that no retrieved document supports. */
  unsupportedClaims: { claim: string; reason: string }[];
  retrieverVersion: string;
  evaluatorVersion: string;
  /** Retrieval cut-off the retrieval metrics were computed at. */
  k: number;
  documents: RetrievedDocument[];
  expectedEvidence: ExpectedEvidence[];
  citations: CitationCheck[];
  metrics: {
    groundedness: Measurement;
    /** Share of answer claims backed by a cited, retrieved document. */
    citationSupport: Measurement;
    recallAtK: Measurement;
    meanReciprocalRank: Measurement;
  };
  failureMode: RagFailureMode;
};

/** Fixed RCA candidate-cause set (taxonomy v1). */
export type RootCauseId =
  | "prompt"
  | "retriever"
  | "retrieved_context"
  | "model_generation"
  | "tool_selection"
  | "tool_arguments"
  | "agent_workflow"
  | "policy_configuration"
  | "malicious_input";

/** Evidence-ranked cause. The score is an evidence score, not a probability. */
export type RcaCause = {
  rank: number;
  causeId: RootCauseId;
  explanation: string;
  evidenceScore: number;
  evidenceEventIds: string[];
};

export type ClassifierKind = "rules" | "logistic_regression" | "xgboost";

export type Investigation = {
  traceId: string;
  applicationName: string;
  provenance: Provenance;
  primaryLabel: string;
  classifier: {
    kind: ClassifierKind;
    version: string;
    score: Measurement;
  };
  ruleFindings: PolicyFinding[];
  evaluatorEvidence: EvaluatorResult[];
  securityFindings: SecurityFinding[];
  /** Empty for NORMAL traces. */
  rca: RcaCause[];
  decisionPath: DecisionStep[];
  decision: Decision;
  reviewHistory: ReviewEntry[];
};
