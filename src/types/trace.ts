import type { ApplicationId, Decision, VersionSet } from "./common";
import type { EvaluatorResult } from "./evaluation";
import type { PolicyFinding, SecurityFinding } from "./governance";

/**
 * Failure labels from taxonomy v1, as used by the UI. The taxonomy is owned
 * by the evaluation module; extend this union only when the taxonomy changes.
 */
export type FailureLabel =
  | "NORMAL"
  | "approval_requirement_unmet"
  | "unsupported_claim"
  | "retrieval_failure"
  | "weak_grounding"
  | "prompt_injection_detected"
  | "tool_argument_malformed";

export type PolicySecurityVerdict = "PASS" | "BLOCK" | "NOT_APPLICABLE";

export type TraceSummary = {
  traceId: string;
  application: ApplicationId;
  applicationName: string;
  appVersion: string;
  /** ISO-8601 UTC. */
  startedAt: string;
  failureLabel: FailureLabel;
  decision: Decision;
  policySecurityVerdict: PolicySecurityVerdict;
};

export type RetrievedDocument = {
  documentId: string;
  title: string;
  score: number;
  rank: number;
};

type EventBase = {
  eventId: string;
  parentId: string | null;
  sequence: number;
  /** ISO-8601 UTC with milliseconds. */
  timestamp: string;
  /** Null when the instrumentation did not record latency. */
  latencyMs: number | null;
};

export type RetrievalEvent = EventBase & {
  type: "retrieval";
  query: string;
  retrieverVersion: string;
  documents: RetrievedDocument[];
};

export type ModelCallEvent = EventBase & {
  type: "model_call";
  model: string;
  summary: string;
  /** Null when token usage is unavailable; never rendered as zero. */
  tokens: { input: number; output: number } | null;
};

export type AgentStateEvent = EventBase & {
  type: "agent_state";
  from: string;
  to: string;
  attributes: Record<string, string | boolean>;
};

export type ToolCallEvent = EventBase & {
  type: "tool_call";
  stage: "proposed";
  tool: string;
  arguments: Record<string, string>;
};

export type ToolResultEvent = EventBase & {
  type: "tool_result";
  tool: string;
  outcome: "executed" | "blocked" | "failed";
  detail: string;
  policyFindingIds: string[];
};

export type FinalResponseEvent = EventBase & {
  type: "final_response";
  text: string;
  flags: string[];
};

export type TraceEvent =
  | RetrievalEvent
  | ModelCallEvent
  | AgentStateEvent
  | ToolCallEvent
  | ToolResultEvent
  | FinalResponseEvent;

export type TraceEventType = TraceEvent["type"];

export type GraphNodeKind =
  | TraceEventType
  | "approval";

/** `missing` marks evidence that should exist but does not (e.g. approval). */
export type GraphNodeState =
  | "ok"
  | "proposed"
  | "blocked"
  | "flagged"
  | "missing";

export type GraphRelation =
  | "supports"
  | "sequence"
  | "requires_approval"
  | "blocked_by_policy"
  | "unsupported_completion";

export type GraphNode = {
  nodeId: string;
  order: number;
  kind: GraphNodeKind;
  label: string;
  state: GraphNodeState;
  /** Absent for derived nodes such as a missing approval. */
  eventId: string | null;
};

export type GraphEdge = {
  from: string;
  to: string;
  relation: GraphRelation;
};

/** Derived by the backend; the browser only renders it. */
export type TraceGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type TraceDetail = {
  summary: TraceSummary;
  versions: VersionSet;
  durationMs: number;
  events: TraceEvent[];
  evaluators: EvaluatorResult[];
  policyFindings: PolicyFinding[];
  securityFindings: SecurityFinding[];
  graph: TraceGraph;
  availableViews: { rag: boolean; investigation: boolean };
};

export type TraceListQuery = {
  q?: string;
  application?: ApplicationId;
  version?: string;
  /** Inclusive ISO dates (YYYY-MM-DD). */
  from?: string;
  to?: string;
  failureLabel?: FailureLabel;
  policySecurityVerdict?: PolicySecurityVerdict;
  decision?: Decision;
  page?: number;
  pageSize?: number;
};

export type TraceFacets = {
  applications: { id: ApplicationId; name: string }[];
  versions: string[];
  failureLabels: FailureLabel[];
};

export type TraceListResult = {
  items: TraceSummary[];
  page: number;
  pageSize: number;
  total: number;
  facets: TraceFacets;
};
