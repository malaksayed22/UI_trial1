import { Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { describeFailureLabel, policySecurityText } from "@/lib/labels";
import { routes } from "@/lib/routes";
import type { Decision, PolicySecurityVerdict, TraceFacets, TraceListQuery } from "@/types";
import { activeFilterCount } from "./query";

const controlClass =
  "w-full rounded-lg border border-line-strong bg-canvas/60 px-3 py-2 text-sm text-ink focus:border-info/60";

type FieldProps = { id: string; label: string; children: ReactNode };

const Field = ({ id, label, children }: FieldProps) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-xs text-muted">
      {label}
    </label>
    {children}
  </div>
);

type TraceFilterBarProps = { query: TraceListQuery; facets: TraceFacets };

const decisions: Decision[] = ["PASS", "REVIEW", "BLOCK"];
const verdicts: PolicySecurityVerdict[] = ["PASS", "BLOCK", "NOT_APPLICABLE"];

/**
 * A plain GET form: filters live in the URL, so a reviewer can share a view
 * or return from Trace Detail without losing context.
 */
export const TraceFilterBar = ({ query, facets }: TraceFilterBarProps) => {
  const activeCount = activeFilterCount(query);
  return (
    <form method="get" action={routes.traces} role="search" aria-label="Filter traces">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <Field id="filter-q" label="Search trace ID, failure label, application or version">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-2.5 size-4 text-faint"
              />
              <input
                id="filter-q"
                name="q"
                type="search"
                defaultValue={query.q ?? ""}
                placeholder="e.g. trace-8f21 or unsupported"
                className={`${controlClass} pl-9`}
              />
            </div>
          </Field>
        </div>

        <Field id="filter-application" label="Application">
          <select id="filter-application" name="application" defaultValue={query.application ?? ""} className={controlClass}>
            <option value="">All applications</option>
            {facets.applications.map(app => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </select>
        </Field>

        <Field id="filter-version" label="Application version">
          <select id="filter-version" name="version" defaultValue={query.version ?? ""} className={controlClass}>
            <option value="">All versions</option>
            {facets.versions.map(version => (
              <option key={version} value={version}>{version}</option>
            ))}
          </select>
        </Field>

        <Field id="filter-from" label="From date (UTC)">
          <input id="filter-from" name="from" type="date" defaultValue={query.from ?? ""} className={controlClass} />
        </Field>

        <Field id="filter-to" label="To date (UTC)">
          <input id="filter-to" name="to" type="date" defaultValue={query.to ?? ""} className={controlClass} />
        </Field>

        <Field id="filter-failure" label="Failure label">
          <select id="filter-failure" name="failureLabel" defaultValue={query.failureLabel ?? ""} className={controlClass}>
            <option value="">All labels</option>
            {facets.failureLabels.map(label => (
              <option key={label} value={label}>{describeFailureLabel(label)}</option>
            ))}
          </select>
        </Field>

        <Field id="filter-verdict" label="Policy / security verdict">
          <select id="filter-verdict" name="policySecurityVerdict" defaultValue={query.policySecurityVerdict ?? ""} className={controlClass}>
            <option value="">All verdicts</option>
            {verdicts.map(verdict => (
              <option key={verdict} value={verdict}>{policySecurityText[verdict]}</option>
            ))}
          </select>
        </Field>

        <Field id="filter-decision" label="Reliability decision">
          <select id="filter-decision" name="decision" defaultValue={query.decision ?? ""} className={controlClass}>
            <option value="">All decisions</option>
            {decisions.map(decision => (
              <option key={decision} value={decision}>{decision}</option>
            ))}
          </select>
        </Field>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="rounded-lg border border-info/40 bg-info/15 px-4 py-2 text-sm font-medium text-info transition-colors hover:bg-info/25"
          >
            Apply filters
          </button>
          {activeCount > 0 && (
            <Link href={routes.traces} className="py-2 text-sm text-muted hover:text-ink">
              Reset ({activeCount})
            </Link>
          )}
        </div>
      </div>
    </form>
  );
};
