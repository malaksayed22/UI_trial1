import type {
  Investigation,
  RagDiagnostics,
  TraceDetail,
  TraceSummary,
} from "@/types";
import { at, PROCUREMENT_VERSIONS } from "./shared";
import {
  procurementBypassDetail,
  procurementBypassInvestigation,
  procurementBypassSummary,
} from "./procurement-bypass";
import {
  procurementSuccessDetail,
  procurementSuccessInvestigation,
  procurementSuccessSummary,
} from "./procurement-success";
import {
  ragUnsupportedDetail,
  ragUnsupportedDiagnostics,
  ragUnsupportedInvestigation,
  ragUnsupportedSummary,
} from "./rag-unsupported-claim";
import {
  ragRetrievalFailureDetail,
  ragRetrievalFailureDiagnostics,
  ragRetrievalFailureInvestigation,
  ragRetrievalFailureSummary,
} from "./rag-retrieval-failure";

export { applicationSummaries, overviewSummary } from "./overview";
export { gateRuns, gateSummaries, latestGateRunId } from "./gates";
export { FIXTURE_NOW, VIEWER } from "./shared";

/**
 * Summary-only traces: they appear in the explorer but have no stored detail
 * in the fixture set, which exercises the "detail unavailable" state.
 */
const summaryOnly: TraceSummary[] = [
  {
    traceId: "trace-06b7fa21",
    application: "procurement-agent",
    applicationName: "Procurement Agent",
    appVersion: "app-v2.3.9",
    startedAt: at("16:20:44", "2026-09-30"),
    failureLabel: "prompt_injection_detected",
    decision: "BLOCK",
    policySecurityVerdict: "BLOCK",
  },
  {
    traceId: "trace-de08f31a",
    application: "procurement-agent",
    applicationName: "Procurement Agent",
    appVersion: PROCUREMENT_VERSIONS.application,
    startedAt: at("11:05:09", "2026-09-30"),
    failureLabel: "NORMAL",
    decision: "PASS",
    policySecurityVerdict: "PASS",
  },
  {
    traceId: "trace-77f120aa",
    application: "rag-assistant",
    applicationName: "Enterprise RAG Assistant",
    appVersion: "app-v1.8.5",
    startedAt: at("14:48:31", "2026-09-29"),
    failureLabel: "weak_grounding",
    decision: "REVIEW",
    policySecurityVerdict: "NOT_APPLICABLE",
  },
];

export const traceSummaries: TraceSummary[] = [
  procurementBypassSummary,
  ragUnsupportedSummary,
  procurementSuccessSummary,
  ragRetrievalFailureSummary,
  ...summaryOnly,
];

export const traceDetails: Record<string, TraceDetail> = {
  [procurementBypassSummary.traceId]: procurementBypassDetail,
  [ragUnsupportedSummary.traceId]: ragUnsupportedDetail,
  [procurementSuccessSummary.traceId]: procurementSuccessDetail,
  [ragRetrievalFailureSummary.traceId]: ragRetrievalFailureDetail,
};

export const investigations: Record<string, Investigation> = {
  [procurementBypassSummary.traceId]: procurementBypassInvestigation,
  [ragUnsupportedSummary.traceId]: ragUnsupportedInvestigation,
  [procurementSuccessSummary.traceId]: procurementSuccessInvestigation,
  [ragRetrievalFailureSummary.traceId]: ragRetrievalFailureInvestigation,
};

export const ragDiagnostics: Record<string, RagDiagnostics> = {
  [ragUnsupportedSummary.traceId]: ragUnsupportedDiagnostics,
  [ragRetrievalFailureSummary.traceId]: ragRetrievalFailureDiagnostics,
};

export const knownVersions = [
  ...new Set(traceSummaries.map(trace => trace.appVersion)),
].sort();
