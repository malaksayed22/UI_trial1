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

/**
 * `technical_failure` is an infrastructure fault; the others are quality
 * outcomes. A retriever that missed the evidence is not a retriever that was down.
 */
export type RagFailureMode =
  | "none"
  | "retrieval_failure"
  | "weak_context"
  | "unsupported_generation"
  | "technical_failure";

export type ExpectedEvidence = {
  documentRef: string;
  retrieved: boolean;
  rank: number | null;
};

/** Half-open character range `[start, end)` over a string. */
export type TextSpan = { start: number; end: number };

export type SourcePassage = {
  passageId: string;
  /** Position inside the document, e.g. "§4.2 ¶1". */
  locator: string;
  text: string;
};

export type SourceDocument = {
  sourceId: string;
  version: string;
  title: string;
  passages: SourcePassage[];
};

export type ClaimCitation = {
  sourceId: string;
  documentVersion: string;
  passageId: string;
  /**
   * Range of the passage text that supports the claim. Null when the model
   * cited this passage but nothing in it supports the claim.
   */
  sourceSpan: TextSpan | null;
};

export type AnswerClaim = {
  claimId: string;
  text: string;
  /** Where the claim sits in `RagDiagnostics.answer`. */
  answerSpan: TextSpan;
  status: "supported" | "unsupported";
  /** Null when the model cited nothing for this claim. */
  citation: ClaimCitation | null;
  /** Why the claim is unsupported; null when supported. */
  reason: string | null;
};

/**
 * - `answered`: the model produced an answer.
 * - `abstained`: the system chose not to answer. This is a decision.
 * - `technical_failure`: a provider fault prevented retrieval or generation.
 *   This is not a decision and says nothing about answer quality.
 */
export type RagOutcome =
  | { kind: "answered" }
  | { kind: "abstained"; reason: string }
  | {
      kind: "technical_failure";
      stage: "retrieval" | "generation";
      provider: string;
      code: string;
      message: string;
      retryable: boolean;
    };

export type RagDiagnostics = {
  traceId: string;
  applicationName: string;
  query: string;
  /** Raw model answer. Null when the model never produced one. */
  answer: string | null;
  outcome: RagOutcome;
  retrieverVersion: string;
  evaluatorVersion: string;
  /** Retrieval cut-off the retrieval metrics were computed at. */
  k: number;
  documents: RetrievedDocument[];
  expectedEvidence: ExpectedEvidence[];
  /** Source text for every passage a claim cites. */
  sources: SourceDocument[];
  claims: AnswerClaim[];
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
