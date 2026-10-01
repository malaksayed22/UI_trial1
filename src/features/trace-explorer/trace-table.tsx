import { Ban, CheckCircle2, CircleSlash } from "lucide-react";
import Link from "next/link";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { Tag } from "@/components/ui/tag";
import {
  TableScroll,
  tableCellClass,
  tableHeadClass,
} from "@/components/ui/table-scroll";
import { formatDateTime } from "@/lib/format";
import { describeFailureLabel } from "@/lib/labels";
import { routes } from "@/lib/routes";
import type { PolicySecurityVerdict, TraceSummary } from "@/types";

const PolicyVerdict = ({ verdict }: { verdict: PolicySecurityVerdict }) => {
  switch (verdict) {
    case "PASS":
      return <Tag tone="pass" icon={CheckCircle2}>Pass</Tag>;
    case "BLOCK":
      return <Tag tone="block" icon={Ban}>Block</Tag>;
    case "NOT_APPLICABLE":
      return <Tag tone="neutral" icon={CircleSlash}>Not applicable</Tag>;
  }
};

type TraceTableProps = { traces: TraceSummary[] };

export const TraceTable = ({ traces }: TraceTableProps) => (
  <TableScroll label="Traces">
    <table className="w-full min-w-[820px]">
      <caption className="sr-only">
        Traces sorted by start time, newest first
      </caption>
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={tableHeadClass}>Trace ID</th>
          <th scope="col" className={tableHeadClass}>Application</th>
          <th scope="col" className={tableHeadClass}>Version</th>
          <th scope="col" className={tableHeadClass}>Started</th>
          <th scope="col" className={tableHeadClass}>Failure label</th>
          <th scope="col" className={tableHeadClass}>Decision</th>
          <th scope="col" className={tableHeadClass}>Policy / security</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {traces.map(trace => (
          <tr key={trace.traceId} className="relative hover:bg-info/5">
            <th scope="row" className={`${tableCellClass} text-left font-normal`}>
              {/* The link stretches over the row so the whole row is one target. */}
              <Link
                href={routes.trace(trace.traceId)}
                className="font-mono text-sm text-info after:absolute after:inset-0 hover:underline"
              >
                {trace.traceId}
              </Link>
            </th>
            <td className={`${tableCellClass} text-muted`}>{trace.applicationName}</td>
            <td className={`${tableCellClass} font-mono text-xs text-muted`}>{trace.appVersion}</td>
            <td className={`${tableCellClass} font-mono text-xs text-muted`}>
              <time dateTime={trace.startedAt}>{formatDateTime(trace.startedAt)}</time>
            </td>
            <td className={`${tableCellClass} text-muted`}>
              {describeFailureLabel(trace.failureLabel)}
            </td>
            <td className={tableCellClass}>
              <DecisionBadge decision={trace.decision} size="sm" />
            </td>
            <td className={tableCellClass}>
              <PolicyVerdict verdict={trace.policySecurityVerdict} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableScroll>
);
