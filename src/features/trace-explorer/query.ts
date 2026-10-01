import { failureLabelText } from "@/lib/labels";
import type {
  ApplicationId,
  Decision,
  FailureLabel,
  PolicySecurityVerdict,
  TraceListQuery,
} from "@/types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const applications: readonly ApplicationId[] = ["procurement-agent", "rag-assistant"];
const decisions: readonly Decision[] = ["PASS", "REVIEW", "BLOCK"];
const verdicts: readonly PolicySecurityVerdict[] = ["PASS", "BLOCK", "NOT_APPLICABLE"];
const failureLabels = Object.keys(failureLabelText) as FailureLabel[];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const oneOf = <T extends string>(allowed: readonly T[], value: string | undefined) =>
  allowed.find(candidate => candidate === value);

const text = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const isoDate = (value: string | undefined) =>
  value && ISO_DATE.test(value) ? value : undefined;

const positiveInteger = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
};

/** URL is the source of truth for filters; unknown or invalid values are dropped. */
export const parseTraceQuery = (params: RawSearchParams): TraceListQuery => ({
  q: text(first(params.q)),
  application: oneOf(applications, first(params.application)),
  version: text(first(params.version)),
  from: isoDate(first(params.from)),
  to: isoDate(first(params.to)),
  failureLabel: oneOf(failureLabels, first(params.failureLabel)),
  policySecurityVerdict: oneOf(verdicts, first(params.policySecurityVerdict)),
  decision: oneOf(decisions, first(params.decision)),
  page: positiveInteger(first(params.page)),
});

const filterKeys = [
  "q",
  "application",
  "version",
  "from",
  "to",
  "failureLabel",
  "policySecurityVerdict",
  "decision",
] as const;

export const activeFilterCount = (query: TraceListQuery) =>
  filterKeys.filter(key => query[key] !== undefined).length;

/** Explorer URL for a page, preserving every active filter. */
export const traceListHref = (query: TraceListQuery, page: number) => {
  const params = new URLSearchParams();
  filterKeys.forEach(key => {
    const value = query[key];
    if (value !== undefined) params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/traces?${search}` : "/traces";
};
