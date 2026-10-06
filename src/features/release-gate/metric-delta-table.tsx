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

type MetricListProps = { metrics: GateMetric[] };

/** Phones get one card per metric so baseline, candidate and delta stay on screen. */
const MetricCards = ({ metrics }: MetricListProps) => (
  <ul aria-label="Metric comparison" className="space-y-2 md:hidden">
    {metrics.map(metric => {
      const signal = signals[metric.signal];
      return (
        <li
          key={`${metric.area}-${metric.name}`}
          className={cn(
            "rounded-xl border p-4",
            metric.signal === "regression" ? "border-block/30 bg-block/5" : "border-line bg-raised/40"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-ink">{metric.name}</p>
              <p className="mt-0.5 text-xs text-faint">
                {metric.area} · {directionText[metric.direction]}
              </p>
            </div>
            <Tag tone={signal.tone} icon={signal.icon}>{signal.label}</Tag>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 font-mono text-sm tabular-nums">
            <div>
              <dt className="font-sans text-xs text-faint">Baseline</dt>
              <dd className="mt-0.5 text-muted">{formatScore(metric.baseline)}</dd>
            </div>
            <div>
              <dt className="font-sans text-xs text-faint">Candidate</dt>
              <dd className="mt-0.5 text-ink">{formatScore(metric.candidate)}</dd>
            </div>
            <div>
              <dt className="font-sans text-xs text-faint">Delta</dt>
              <dd className={cn("mt-0.5", signal.text)}>{formatDelta(metric.delta)}</dd>
            </div>
          </dl>
        </li>
      );
    })}
  </ul>
);

type MetricDeltaTableProps = {
  metrics: GateMetric[];
  datasetVersion: string;
  traceCount: number;
};

const MetricRows = ({ metrics }: MetricListProps) => (
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
);

/** Deltas and signals come from the gate result; they are never recomputed here. */
export const MetricDeltaTable = ({ metrics, datasetVersion }: MetricDeltaTableProps) => (
  <Panel aria-labelledby="metrics-heading">
    <PanelHeader
      headingId="metrics-heading"
      title="Metric comparison"
      subtitle={`Candidate versus approved baseline · evaluation set ${datasetVersion}`}
    />
    <MetricCards metrics={metrics} />
    <div className="hidden md:block">
      <MetricRows metrics={metrics} />
    </div>
  </Panel>
);
