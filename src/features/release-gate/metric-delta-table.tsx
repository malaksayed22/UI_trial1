import { Eye, Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag, type TagTone } from "@/components/ui/tag";
import {
  TableScroll,
  tableCellClass,
  tableHeadClass,
} from "@/components/ui/table-scroll";
import { cn } from "@/lib/cn";
import { formatDelta, formatScore } from "@/lib/format";
import type { GateMetric, GateSignal } from "@/types";

const signals: Record<GateSignal, { label: string; tone: TagTone; icon: LucideIcon; text: string }> = {
  regression: { label: "Regression", tone: "block", icon: TrendingDown, text: "text-block" },
  watch: { label: "Watch", tone: "review", icon: Eye, text: "text-review" },
  stable: { label: "Stable", tone: "pass", icon: Minus, text: "text-pass" },
  improved: { label: "Improved", tone: "pass", icon: TrendingUp, text: "text-pass" },
};

const directionText = {
  higher_is_better: "higher is better",
  lower_is_better: "lower is better",
} as const;

type MetricDeltaTableProps = {
  metrics: GateMetric[];
  datasetVersion: string;
  traceCount: number;
};

/** Deltas and signals come from the gate result; they are never recomputed here. */
export const MetricDeltaTable = ({ metrics, datasetVersion }: MetricDeltaTableProps) => (
  <Panel aria-labelledby="metrics-heading">
    <PanelHeader
      headingId="metrics-heading"
      title="Metric comparison"
      subtitle={`Candidate versus approved baseline · evaluation set ${datasetVersion}`}
    />
    <TableScroll label="Metric comparison">
      <table className="w-full min-w-[680px]">
        <caption className="sr-only">
          Baseline and candidate values per metric, with delta and signal
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={tableHeadClass}>Area</th>
            <th scope="col" className={tableHeadClass}>Metric</th>
            <th scope="col" className={`${tableHeadClass} text-right`}>Baseline</th>
            <th scope="col" className={`${tableHeadClass} text-right`}>Candidate</th>
            <th scope="col" className={`${tableHeadClass} text-right`}>Delta</th>
            <th scope="col" className={tableHeadClass}>Signal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {metrics.map(metric => {
            const signal = signals[metric.signal];
            return (
              <tr
                key={`${metric.area}-${metric.name}`}
                className={cn(metric.signal === "regression" && "bg-block/5")}
              >
                <td className={`${tableCellClass} text-muted`}>{metric.area}</td>
                <th scope="row" className={`${tableCellClass} text-left font-normal`}>
                  <span className="block text-ink">{metric.name}</span>
                  <span className="text-xs text-faint">{directionText[metric.direction]}</span>
                </th>
                <td className={`${tableCellClass} text-right font-mono tabular-nums text-muted`}>
                  {formatScore(metric.baseline)}
                </td>
                <td className={`${tableCellClass} text-right font-mono tabular-nums text-ink`}>
                  {formatScore(metric.candidate)}
                </td>
                <td className={cn(tableCellClass, "text-right font-mono tabular-nums", signal.text)}>
                  {formatDelta(metric.delta)}
                </td>
                <td className={tableCellClass}>
                  <Tag tone={signal.tone} icon={signal.icon}>{signal.label}</Tag>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScroll>
  </Panel>
);
