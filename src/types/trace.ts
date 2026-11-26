import type { ApplicationId, Decision, VersionSet } from "./common";
import type { EvaluatorResult } from "./evaluation";
import type {
  ActionRecord,
  ApprovalRecord,
  ResponseDelivery,
  StateTransition,
  TraceStatus,
} from "./execution";
import type { PolicyFinding, SecurityFinding, SupplierLookup } from "./governance";

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
  | "tool_argument_malformed"
  | "unknown_side_effect"
  | "tool_not_dispatched"
  | "provider_failure";

/**
 * PASS, NOT_APPLICABLE and UNAVAILABLE are different statements: passed,
 * never applicable, and could not be evaluated. UNAVAILABLE is never a PASS.
 */
export type PolicySecurityVerdict =
  | "PASS"
  | "BLOCK"
  | "NOT_APPLICABLE"
  | "UNAVAILABLE";

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
  /** Version of the document that was retrieved. */
  version: string;
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
  /**
   * Set when the retrieval provider failed. An empty `documents` list with a
   * null `failure` means retrieval ran and found nothing.
   */
  failure: { code: string; message: string } | null;
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
  actionId: string;
  tool: string;
  arguments: Record<string, string>;
};

export type ToolResultEvent = EventBase & {
  type: "tool_result";
  actionId: string;
  tool: string;
  /** `unconfirmed`: dispatched, but no confirmation came back. */
  outcome: "executed" | "blocked" | "failed" | "unconfirmed";
  detail: string;
  policyFindingIds: string[];
};

/**
 * APPLICATION-LOCAL, pending Mohab's canonical mapping. A trusted snapshot of
 * the supplier directory, read before the policy check. It is the evidence a
 * supplier finding cites; a tool proposal is not.
 */
export type SupplierDirectoryEvent = EventBase & {
  type: "supplier_directory_snapshot";
  lookup: SupplierLookup;
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
  | SupplierDirectoryEvent
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

/** A fixture that forces a path the normal application would not take. */
export type SyntheticBoundaryNote = {
  kind: "synthetic_boundary_case";
  text: string;
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
  status: TraceStatus;
  actions: ActionRecord[];
  approvals: ApprovalRecord[];
  /**
   * APPLICATION-LOCAL. Labels a fixture that forces a path the normal
   * application would not take. Absent for ordinary traces.
   */
  scenarioNote?: SyntheticBoundaryNote;
  /** TRD-22. Absent when the trace does not carry transition data. */
  stateTransitions?: StateTransition[];
  delivery: ResponseDelivery;
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
