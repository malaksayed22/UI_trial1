import { cn } from "@/lib/cn";
import { formatInteger, formatPercent } from "@/lib/format";
import type { Decision, DecisionCounts } from "@/types";

const order: Decision[] = ["PASS", "REVIEW", "BLOCK"];

const segmentClass: Record<Decision, string> = {
  PASS: "bg-pass",
  REVIEW: "bg-review",
  BLOCK: "bg-block",
};

const textClass: Record<Decision, string> = {
  PASS: "text-pass",
  REVIEW: "text-review",
  BLOCK: "text-block",
};

type DistributionBarProps = {
  counts: DecisionCounts;
  label: string;
  className?: string;
};

/** Proportional PASS/REVIEW/BLOCK bar with an always-visible text legend. */
export const DistributionBar = ({ counts, label, className }: DistributionBarProps) => {
  const total = order.reduce((sum, key) => sum + counts[key], 0);
  const summary = order
    .map(key => `${key} ${formatInteger(counts[key])}`)
    .join(", ");

  return (
    <div className={className}>
      <div
        role="img"
        aria-label={`${label}: ${summary}`}
        className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-raised"
      >
        {order.map(key => (
          <div
            key={key}
            className={cn("h-full", segmentClass[key])}
            style={{ width: `${total === 0 ? 0 : (counts[key] / total) * 100}%` }}
          />
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {order.map(key => (
          <div key={key} className="flex items-baseline gap-1.5">
            <dt className={cn("font-semibold tracking-wider", textClass[key])}>{key}</dt>
            <dd className="font-mono text-muted tabular-nums">
              {formatInteger(counts[key])}
              <span className="text-faint"> · {formatPercent(counts[key], total)}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
