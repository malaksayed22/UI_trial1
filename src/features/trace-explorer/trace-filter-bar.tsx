"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { DateField } from "@/components/ui/date-field";
import { SearchField } from "@/components/ui/search-field";
import { SelectMenu, type SelectOption } from "@/components/ui/select-menu";
import { describeFailureLabel, policySecurityText } from "@/lib/labels";
import { routes } from "@/lib/routes";
import type { Decision, PolicySecurityVerdict, TraceFacets, TraceListQuery } from "@/types";

type TraceFilterBarProps = { query: TraceListQuery; facets: TraceFacets };

/** Form state: every control holds a string, "" meaning "no filter". */
type Draft = {
  q: string;
  application: string;
  version: string;
  from: string;
  to: string;
  failureLabel: string;
  policySecurityVerdict: string;
  decision: string;
};

const SEARCH_DEBOUNCE_MS = 300;

const decisions: Decision[] = ["PASS", "REVIEW", "BLOCK"];
const verdicts: PolicySecurityVerdict[] = ["PASS", "BLOCK", "NOT_APPLICABLE"];

const draftFromQuery = (query: TraceListQuery): Draft => ({
  q: query.q ?? "",
  application: query.application ?? "",
  version: query.version ?? "",
  from: query.from ?? "",
  to: query.to ?? "",
  failureLabel: query.failureLabel ?? "",
  policySecurityVerdict: query.policySecurityVerdict ?? "",
  decision: query.decision ?? "",
});

const emptyDraft = draftFromQuery({});

const draftKeys = Object.keys(emptyDraft) as (keyof Draft)[];

/** Filter changes always restart pagination, so `page` is never carried over. */
const hrefFromDraft = (draft: Draft) => {
  const params = new URLSearchParams();
  draftKeys.forEach(key => {
    const value = draft[key].trim();
    if (value) params.set(key, value);
  });
  const search = params.toString();
  return search ? `${routes.traces}?${search}` : routes.traces;
};

const activeCount = (draft: Draft) => draftKeys.filter(key => draft[key].trim() !== "").length;

/**
 * Filters live in the URL, so a reviewer can share a view or return from Trace
 * Detail without losing context. Controls apply as they change: selects and
 * dates immediately, the search box after a short pause in typing.
 */
export const TraceFilterBar = ({ query, facets }: TraceFilterBarProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(() => draftFromQuery(query));
  const [lastPushedHref, setLastPushedHref] = useState(() => hrefFromDraft(draft));
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Follow the URL when it changes from outside (Back button, Reset link elsewhere).
  const queryHref = hrefFromDraft(draftFromQuery(query));
  const [syncedHref, setSyncedHref] = useState(queryHref);
  if (syncedHref !== queryHref) {
    setSyncedHref(queryHref);
    if (queryHref !== lastPushedHref) setDraft(draftFromQuery(query));
  }

  useEffect(() => () => clearTimeout(debounce.current), []);

  const push = (next: Draft) => {
    clearTimeout(debounce.current);
    const href = hrefFromDraft(next);
    setLastPushedHref(href);
    startTransition(() => router.replace(href, { scroll: false }));
  };

  const update = (key: keyof Draft, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (key !== "q") return push(next);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => push(next), value === "" ? 0 : SEARCH_DEBOUNCE_MS);
  };

  const reset = () => {
    setDraft(emptyDraft);
    push(emptyDraft);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    push(draft);
  };

  const applications: SelectOption[] = facets.applications.map(app => ({ value: app.id, label: app.name }));
  const versions: SelectOption[] = facets.versions.map(version => ({ value: version, label: version }));
  const failureLabels: SelectOption[] = facets.failureLabels.map(label => ({
    value: label,
    label: describeFailureLabel(label),
  }));
  const verdictOptions: SelectOption[] = verdicts.map(verdict => ({
    value: verdict,
    label: policySecurityText[verdict],
  }));
  const decisionOptions: SelectOption[] = decisions.map(decision => ({ value: decision, label: decision }));
  const count = activeCount(draft);

  return (
    <form onSubmit={onSubmit} role="search" aria-label="Filter traces">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <SearchField
            label="Search trace ID, failure label, application or version"
            placeholder="Start typing, e.g. trace-8f21 or unsupported"
            value={draft.q}
            pending={isPending}
            onChange={value => update("q", value)}
          />
        </div>

        <SelectMenu
          label="Application"
          placeholder="All applications"
          value={draft.application}
          options={applications}
          onChange={value => update("application", value)}
        />
        <SelectMenu
          label="Application version"
          placeholder="All versions"
          value={draft.version}
          options={versions}
          onChange={value => update("version", value)}
        />
        <DateField
          label="From date (UTC)"
          placeholder="Any start date"
          value={draft.from}
          max={draft.to || undefined}
          onChange={value => update("from", value)}
        />
        <DateField
          label="To date (UTC)"
          placeholder="Any end date"
          value={draft.to}
          min={draft.from || undefined}
          onChange={value => update("to", value)}
        />
        <SelectMenu
          label="Failure label"
          placeholder="All labels"
          value={draft.failureLabel}
          options={failureLabels}
          onChange={value => update("failureLabel", value)}
        />
        <SelectMenu
          label="Policy / security verdict"
          placeholder="All verdicts"
          value={draft.policySecurityVerdict}
          options={verdictOptions}
          onChange={value => update("policySecurityVerdict", value)}
        />
        <SelectMenu
          label="Reliability decision"
          placeholder="All decisions"
          value={draft.decision}
          options={decisionOptions}
          onChange={value => update("decision", value)}
        />

        <div className="flex items-end">
          {count > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm text-muted transition-colors hover:border-faint/60 hover:bg-canvas hover:text-ink"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              Reset filters
              <span className="rounded-md bg-raised px-1.5 py-0.5 text-xs tabular-nums text-ink">{count}</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
