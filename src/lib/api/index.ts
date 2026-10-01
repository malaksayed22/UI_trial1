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
  TraceListQuery,
  TraceListResult,
  Viewer,
} from "@/types";
import { apiGet, apiPost } from "./client";

export { dataSource } from "./client";
export { ApiError, isApiError } from "./errors";
export { settle, type Settled } from "./settle";

const traceBase = (traceId: string) => `/traces/${encodeURIComponent(traceId)}`;

export const api = {
  getViewer: () => apiGet<Viewer>("/viewer"),
  getOverview: () => apiGet<OverviewSummary>("/overview"),
  getApplications: () => apiGet<ApplicationSummary[]>("/applications"),
  listTraces: (query: TraceListQuery) => apiGet<TraceListResult>("/traces", query),
  getTrace: (traceId: string) => apiGet<TraceDetail>(traceBase(traceId)),
  getRagDiagnostics: (traceId: string) =>
    apiGet<RagDiagnostics>(`${traceBase(traceId)}/rag`),
  getInvestigation: (traceId: string) =>
    apiGet<Investigation>(`${traceBase(traceId)}/investigation`),
  listGates: () => apiGet<GateSummary[]>("/release-gates"),
  getGate: (runId: string) =>
    apiGet<GateRun>(`/release-gates/${encodeURIComponent(runId)}`),
  submitReview: (submission: ReviewSubmission) =>
    apiPost<ReviewEntry>("/reviews", submission),
};
