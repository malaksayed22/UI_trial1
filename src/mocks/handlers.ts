import { ApiError } from "@/lib/api/errors";
import { describeFailureLabel } from "@/lib/labels";
import type {
  ApplicationSummary,
  GateRun,
  GateSummary,
  Investigation,
  OverviewSummary,
  RagDiagnostics,
  ReviewEntry,
  ReviewSubmission,
  TraceDetail,
  TraceFacets,
  TraceListQuery,
  TraceListResult,
  TraceSummary,
  Viewer,
} from "@/types";
import {
  applicationSummaries,
  gateRuns,
  gateSummaries,
  investigations,
  knownVersions,
  overviewSummary,
  ragDiagnostics,
  traceDetails,
  traceSummaries,
  VIEWER,
} from "./fixtures";
import { appendReview, listAppendedReviews } from "./review-store";

/**
 * Fixture-backed implementation of the platform API. It honours the same
 * filter, sort and pagination contract as the live endpoints so screens never
 * load the whole dataset into the browser.
 */

export type MockRequest = {
  method: "GET" | "POST";
  path: string;
  query: Record<string, string | undefined>;
  body?: unknown;
};

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const matchesText = (trace: TraceSummary, q: string) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [
    trace.traceId,
    trace.applicationName,
    trace.appVersion,
    describeFailureLabel(trace.failureLabel),
  ].some(value => value.toLowerCase().includes(needle));
};

const withinDates = (trace: TraceSummary, from?: string, to?: string) => {
  const day = trace.startedAt.slice(0, 10);
  return (!from || day >= from) && (!to || day <= to);
};

export const queryTraces = (query: TraceListQuery): TraceListResult => {
  const pageSize = Math.min(
    Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );
  const filtered = traceSummaries
    .filter(trace => matchesText(trace, query.q ?? ""))
    .filter(trace => !query.application || trace.application === query.application)
    .filter(trace => !query.version || trace.appVersion === query.version)
    .filter(trace => withinDates(trace, query.from, query.to))
    .filter(trace => !query.failureLabel || trace.failureLabel === query.failureLabel)
    .filter(
      trace =>
        !query.policySecurityVerdict ||
        trace.policySecurityVerdict === query.policySecurityVerdict
    )
    .filter(trace => !query.decision || trace.decision === query.decision)
    // Deterministic order: newest first, trace ID as the tie-breaker.
    .sort(
      (a, b) =>
        b.startedAt.localeCompare(a.startedAt) ||
        a.traceId.localeCompare(b.traceId)
    );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);
  const start = (page - 1) * pageSize;

  const facets: TraceFacets = {
    applications: [
      ...new Map(
        traceSummaries.map(t => [t.application, t.applicationName] as const)
      ),
    ].map(([id, name]) => ({ id, name })),
    versions: knownVersions,
    failureLabels: [...new Set(traceSummaries.map(t => t.failureLabel))],
  };

  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    facets,
  };
};

const withReviews = <T extends { reviewHistory: ReviewEntry[] }>(
  value: T,
  target: ReviewSubmission["target"]
): T => ({
  ...value,
  reviewHistory: [...listAppendedReviews(target), ...value.reviewHistory],
});

const requireFound = <T>(value: T | undefined, what: string): T => {
  if (value === undefined) {
    throw new ApiError("not_found", `${what} is not available in the fixture set.`);
  }
  return value;
};

const getTraceDetail = (traceId: string): TraceDetail =>
  requireFound(traceDetails[traceId], `Trace ${traceId}`);

const getRag = (traceId: string): RagDiagnostics => {
  const detail = traceDetails[traceId];
  if (detail && !detail.availableViews.rag) {
    throw new ApiError(
      "not_applicable",
      "RAG diagnostics apply to retrieval-augmented traces only."
    );
  }
  return requireFound(ragDiagnostics[traceId], `RAG diagnostics for ${traceId}`);
};

const getInvestigation = (traceId: string): Investigation =>
  withReviews(
    requireFound(investigations[traceId], `Investigation for ${traceId}`),
    { kind: "trace", traceId }
  );

const getGate = (runId: string): GateRun =>
  withReviews(
    requireFound(
      gateRuns.find(run => run.runId === runId),
      `Release gate ${runId}`
    ),
    { kind: "release", runId }
  );

const isSubmission = (body: unknown): body is ReviewSubmission =>
  typeof body === "object" &&
  body !== null &&
  "target" in body &&
  "verdict" in body &&
  "rationale" in body;

const parseQuery = (query: MockRequest["query"]): TraceListQuery => ({
  q: query.q,
  application: query.application as TraceListQuery["application"],
  version: query.version,
  from: query.from,
  to: query.to,
  failureLabel: query.failureLabel as TraceListQuery["failureLabel"],
  policySecurityVerdict:
    query.policySecurityVerdict as TraceListQuery["policySecurityVerdict"],
  decision: query.decision as TraceListQuery["decision"],
  page: query.page ? Number(query.page) : undefined,
  pageSize: query.pageSize ? Number(query.pageSize) : undefined,
});

const notFoundRoute = (request: MockRequest) =>
  new ApiError("not_found", `No mock handler for ${request.method} ${request.path}`);

export const resolveMock = async (request: MockRequest): Promise<unknown> => {
  const { method, path } = request;
  const segments = path.split("/").filter(Boolean);

  if (method === "GET") {
    if (path === "/viewer") return VIEWER satisfies Viewer;
    if (path === "/overview") return overviewSummary satisfies OverviewSummary;
    if (path === "/applications") {
      return applicationSummaries satisfies ApplicationSummary[];
    }
    if (path === "/release-gates") return gateSummaries satisfies GateSummary[];
    if (path === "/traces") return queryTraces(parseQuery(request.query));

    const [root, id, view] = segments;
    if (root === "traces" && id && !view) return getTraceDetail(id);
    if (root === "traces" && id && view === "rag") return getRag(id);
    if (root === "traces" && id && view === "investigation") {
      return getInvestigation(id);
    }
    if (root === "release-gates" && id && !view) return getGate(id);
  }

  if (method === "POST" && path === "/reviews") {
    if (!isSubmission(request.body)) {
      throw new ApiError("invalid", "Malformed review submission.");
    }
    return appendReview(VIEWER, request.body);
  }

  throw notFoundRoute(request);
};
