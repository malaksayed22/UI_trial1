import type { Metadata } from "next";
import Link from "next/link";
import { ApiErrorNotice } from "@/components/ui/api-error-notice";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel } from "@/components/ui/panel";
import { StateNotice } from "@/components/ui/state-notice";
import { TraceFilterBar } from "@/features/trace-explorer/trace-filter-bar";
import { TraceTable } from "@/features/trace-explorer/trace-table";
import {
  parseTraceQuery,
  traceListHref,
  type RawSearchParams,
} from "@/features/trace-explorer/query";
import { api, settle } from "@/lib/api";
import { formatInteger } from "@/lib/format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Trace Explorer" };

type TracesPageProps = { searchParams: Promise<RawSearchParams> };

const TracesPage = async ({ searchParams }: TracesPageProps) => {
  const query = parseTraceQuery(await searchParams);
  const result = await settle(api.listTraces(query));
  if (!result.ok) return <ApiErrorNotice error={result.error} />;

  const { items, page, pageSize, total, facets } = result.data;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = (page - 1) * pageSize + items.length;

  return (
    <>
      <PageHeader
        eyebrow="Screen 03 · Trace Explorer"
        title="Trace Explorer"
        description="Which traces need investigation? Filter, then open one to reconstruct what happened."
      />

      <Panel className="mb-4">
        <TraceFilterBar query={query} facets={facets} />
      </Panel>

      {items.length === 0 ? (
        <StateNotice
          kind="empty"
          title="No traces match these filters"
          action={
            <Link href={routes.traces} className="text-sm text-info hover:underline">
              Reset filters
            </Link>
          }
        >
          Widen the date range or clear a filter to see more traces.
        </StateNotice>
      ) : (
        <Panel className="p-2 sm:p-3">
          <TraceTable traces={items} />
          <div className="flex flex-col items-start justify-between gap-3 border-t border-line px-2 pt-4 sm:flex-row sm:items-center">
            <p role="status" className="text-xs text-faint">
              Showing {formatInteger(first)}–{formatInteger(last)} of{" "}
              {formatInteger(total)} traces
            </p>
            <Pagination
              page={page}
              pageCount={pageCount}
              hrefFor={target => traceListHref(query, target)}
            />
          </div>
        </Panel>
      )}
    </>
  );
};

export default TracesPage;
