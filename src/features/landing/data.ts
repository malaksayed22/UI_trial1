/**
 * Marketing copy and illustrative values for the landing page. Numbers mirror
 * the reviewed fixtures (trace-8f21c9a4, gate-2026-1001-01) so the story the
 * landing tells is the story the console shows.
 */

export const TRACE_ID = "trace-8f21c9a4";
export const TRACE_DURATION_MS = 1288;

export type SpanTone = "info" | "model" | "review" | "block" | "muted";

export type TraceSpan = {
  id: string;
  kind: string;
  label: string;
  detail: string;
  startMs: number;
  durationMs: number;
  tone: SpanTone;
};

export const traceSpans: readonly TraceSpan[] = [
  { id: "ev-1", kind: "retrieval", label: "POL-114", detail: "score 0.94", startMs: 0, durationMs: 38, tone: "info" },
  { id: "ev-2", kind: "model_call", label: "gpt-4.1-mini-v3", detail: "312 tokens", startMs: 38, durationMs: 866, tone: "model" },
  { id: "ev-4", kind: "agent_state", label: "PRE_APPROVAL", detail: "approval_received = false", startMs: 1000, durationMs: 0, tone: "review" },
  { id: "ev-5", kind: "tool_call", label: "create_purchase_order", detail: "$48,200 · SUP-2291", startMs: 1115, durationMs: 0, tone: "review" },
  { id: "ev-6", kind: "tool_result", label: "blocked by policy", detail: "approval_required_before_po", startMs: 1127, durationMs: 12, tone: "block" },
  { id: "ev-7", kind: "final_response", label: "“Your purchase order has been submitted.”", detail: "unsupported_claim", startMs: 1288, durationMs: 0, tone: "block" },
];

export const pipelineSteps = [
  {
    key: "trace",
    number: "01",
    title: "Trace",
    summary: "Every retrieval, model call and tool proposal, in order.",
    headline: "The path behind the answer",
    caption: "Seven ordered events reconstructed from one request. The approval node is missing, and that absence is the finding.",
  },
  {
    key: "evidence",
    number: "02",
    title: "Evidence",
    summary: "Deterministic checks, policy rules and judges — scored, never guessed.",
    headline: "Signals, scored honestly",
    caption: "Not applicable stays not applicable. A missing score is never rendered as zero.",
  },
  {
    key: "cause",
    number: "03",
    title: "Root cause",
    summary: "A ranked top‑3 with the events that justify each cause.",
    headline: "Why it failed, ranked",
    caption: "Each cause cites the exact events it was derived from, so a reviewer can disagree with evidence.",
  },
  {
    key: "gate",
    number: "04",
    title: "Gate",
    summary: "Candidate versus approved baseline, resolved to PASS, REVIEW or BLOCK.",
    headline: "A release you can defend",
    caption: "A severe regression without a critical failure resolves to BLOCK. The rule is printed next to the verdict.",
  },
] as const;

export const graphNodes = [
  { label: "Retrieved POL-114", state: "ok" },
  { label: "Plan drafted", state: "ok" },
  { label: "PRE_APPROVAL", state: "ok" },
  { label: "Tier-2 approval", state: "missing" },
  { label: "create_purchase_order", state: "proposed" },
  { label: "Tool blocked", state: "blocked" },
  { label: "Claims PO submitted", state: "flagged" },
] as const;

export type NodeState = (typeof graphNodes)[number]["state"];

export const evaluatorScores = [
  { name: "Tool argument validator", family: "deterministic", value: 1, note: "valid", tone: "pass" },
  { name: "Workflow trajectory", family: "workflow", value: 0, note: "no approval event", tone: "block" },
  { name: "Policy conformance", family: "policy", value: 0, note: "0 of 3 passed", tone: "block" },
  { name: "Unsupported-claim risk", family: "semantic", value: 0.88, note: "lower is better", tone: "review" },
  { name: "Prompt-injection detector", family: "security", value: 0.04, note: "lower is better", tone: "pass" },
  { name: "Groundedness", family: "rag", value: null, note: "not applicable", tone: "muted" },
] as const;

export const rootCauses = [
  { rank: 1, cause: "agent_workflow", score: 0.91, text: "Tool proposed while workflow_stage was PRE_APPROVAL.", events: "ev-4 · ev-5" },
  { rank: 2, cause: "prompt", score: 0.74, text: "prompt-v1.7.2 never instructs the agent to wait for approval.", events: "ev-2 · ev-4" },
  { rank: 3, cause: "policy_configuration", score: 0.52, text: "Supplier-tier threshold not re-checked after the amount changed.", events: "ev-5" },
] as const;

export const gateMetrics = [
  { group: "RAG", name: "Groundedness", baseline: 0.91, candidate: 0.79, delta: "−0.12", status: "regression" },
  { group: "Overall", name: "Failure rate", baseline: 0.08, candidate: 0.13, delta: "+0.05", status: "regression" },
  { group: "Overall", name: "Reliability", baseline: 0.9, candidate: 0.86, delta: "−0.04", status: "regression" },
  { group: "Agent", name: "Workflow compliance", baseline: 0.97, candidate: 0.96, delta: "−0.01", status: "stable" },
] as const;

export const failureClasses = [
  { label: "unsupported_claim", count: 58 },
  { label: "retrieval_failure", count: 47 },
  { label: "approval_requirement_unmet", count: 41 },
  { label: "tool_argument_malformed", count: 28 },
  { label: "weak_grounding", count: 24 },
  { label: "prompt_injection_detected", count: 20 },
  { label: "citation_drift", count: 17 },
  { label: "policy_configuration_gap", count: 11 },
] as const;

export const trend = {
  pass: [182, 190, 176, 201, 195, 168, 150, 188, 204, 199, 210, 197, 185, 212],
  review: [12, 10, 14, 9, 11, 13, 8, 10, 9, 7, 8, 9, 6, 7],
  block: [5, 4, 6, 3, 4, 5, 3, 4, 3, 2, 3, 2, 3, 2],
} as const;

export const rigorStats = [
  { value: 3038, decimals: 0, suffix: "", label: "traces evaluated", note: "30-day window" },
  { value: 8, decimals: 0, suffix: "", label: "failure classes", note: "labelled and classified" },
  { value: 3, decimals: 0, suffix: "", label: "ranked root causes", note: "each with cited events" },
  { value: 92.8, decimals: 1, suffix: "%", label: "traces passing", note: "2,820 of 3,038" },
] as const;

export const principles = [
  {
    title: "Falsifiable by design",
    text: "Every claim is tied to an experiment that can fail. Baselines are interpretable, so a negative result is still a result.",
  },
  {
    title: "The UI never recomputes",
    text: "Scores, rankings and decisions are rendered exactly as the backend produced them. The interface can’t quietly improve a number.",
  },
  {
    title: "Human review is append-only",
    text: "Reviewers add to the record and never overwrite the machine decision, so the audit trail survives disagreement.",
  },
] as const;
