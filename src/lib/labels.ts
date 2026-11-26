import type {
  ApprovalStatus,
  ClassifierKind,
  Criticality,
  DeliveryDisposition,
  EvaluatorFamily,
  ExecutionStatus,
  FailureLabel,
  GraphRelation,
  PolicySecurityVerdict,
  PolicyStage,
  RagFailureMode,
  RootCauseId,
} from "@/types";

/** Plain-language labels. Technical identifiers stay available as tooltips. */

export const failureLabelText: Record<FailureLabel, string> = {
  NORMAL: "Normal",
  approval_requirement_unmet: "Approval requirement unmet",
  unsupported_claim: "Unsupported claim",
  retrieval_failure: "Retrieval failure",
  weak_grounding: "Weak grounding",
  prompt_injection_detected: "Prompt injection detected",
  tool_argument_malformed: "Tool argument malformed",
  unknown_side_effect: "Unknown side effect",
  tool_not_dispatched: "Tool not dispatched",
  provider_failure: "Provider failure",
};

/** Accepts labels outside the known union (e.g. a newer taxonomy version). */
export const describeFailureLabel = (label: string) =>
  (failureLabelText as Record<string, string>)[label] ?? label;

export const rootCauseText: Record<RootCauseId, string> = {
  prompt: "Prompt",
  retriever: "Retriever",
  retrieved_context: "Retrieved context",
  model_generation: "Model generation",
  tool_selection: "Tool selection",
  tool_arguments: "Tool arguments",
  agent_workflow: "Agent workflow",
  policy_configuration: "Policy configuration",
  malicious_input: "Malicious input",
};

/** Shown wherever RCA was deliberately not run for a synthetic boundary case. */
export const RCA_NOT_ASSESSED_SYNTHETIC_TEXT = "RCA not assessed for this synthetic boundary case";

export const classifierText: Record<ClassifierKind, string> = {
  rules: "Deterministic rules",
  logistic_regression: "Logistic regression",
  xgboost: "XGBoost",
};

export const evaluatorFamilyText: Record<EvaluatorFamily, string> = {
  deterministic: "Deterministic",
  rag: "RAG",
  semantic: "Semantic (LLM)",
  workflow: "Workflow",
  security: "Security",
  policy: "Policy",
};

export const criticalityText: Record<Criticality, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const policySecurityText: Record<PolicySecurityVerdict, string> = {
  PASS: "Pass",
  BLOCK: "Block",
  NOT_APPLICABLE: "Not applicable",
  UNAVAILABLE: "Unavailable",
};

export const policySecurityMeaning: Record<PolicySecurityVerdict, string> = {
  PASS: "Policy and security checks ran and passed",
  BLOCK: "A policy or security check failed",
  NOT_APPLICABLE: "These checks do not apply to this trace",
  UNAVAILABLE: "A check could not run. This is not a pass",
};

export const approvalStatusText: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
  cancelled: "Cancelled",
};

export const policyStageText: Record<PolicyStage, string> = {
  not_applicable: "Not applicable",
  not_evaluated: "Not evaluated",
  gate_passed: "Gate passed",
  gate_blocked: "Gate blocked",
};

export const executionStatusText: Record<ExecutionStatus, string> = {
  not_applicable: "Not applicable",
  not_executed: "Not executed",
  executed: "Executed",
  failed: "Failed",
  outcome_unknown: "Outcome unknown",
};

export const deliveryDispositionText: Record<DeliveryDisposition, string> = {
  unchanged: "Delivered unchanged",
  corrected: "Corrected before delivery",
  suppressed: "Suppressed and replaced",
  no_candidate: "No model candidate",
};

export const relationText: Record<GraphRelation, string> = {
  supports: "supports",
  sequence: "then",
  requires_approval: "requires approval",
  blocked_by_policy: "blocked by policy",
  unsupported_completion: "completion unsupported by",
};

export const ragFailureModeText: Record<
  RagFailureMode,
  { title: string; description: string }
> = {
  none: {
    title: "No RAG failure",
    description: "Retrieval and the answer are both supported by evidence.",
  },
  retrieval_failure: {
    title: "Retrieval failure",
    description:
      "The retriever did not return the expected evidence, so the answer could not be grounded.",
  },
  weak_context: {
    title: "Weak context",
    description:
      "Relevant evidence was retrieved but ranked too low or was too thin to support the answer.",
  },
  unsupported_generation: {
    title: "Unsupported generation",
    description:
      "Relevant evidence was retrieved, but the answer adds claims that no document supports.",
  },
  technical_failure: {
    title: "Technical failure",
    description:
      "A provider fault stopped the pipeline. Nothing can be concluded about retrieval or answer quality.",
  },
};
