import { Panel, PanelHeader } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { formatInteger, formatShortDate } from "@/lib/format";
import type { Decision, TrendPoint } from "@/types";

/** Bottom-to-top stacking order. */
const STACK: { key: Decision; swatch: string }[] = [
  { key: "PASS", swatch: "bg-pass" },
  { key: "REVIEW", swatch: "bg-review" },
  { key: "BLOCK", swatch: "bg-block" },
];

const niceCeiling = (value: number) => Math.ceil(value / 50) * 50;

const percentOf = (value: number, max: number) => `${(value / max) * 100}%`;

type ReliabilityTrendProps = { points: TrendPoint[] };

/**
 * Daily decision volume as stacked columns. Built from flex boxes so it fills
 * the height of its card and keeps its labels at a readable size on any width.
 * The same numbers are exposed as a table for assistive technology, and each
 * series is named in the legend.
 */
export const ReliabilityTrend = ({ points }: ReliabilityTrendProps) => {
  const totals = points.map(p => p.counts.PASS + p.counts.REVIEW + p.counts.BLOCK);
  const max = niceCeiling(Math.max(1, ...totals));
  const labelIndexes = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <Panel aria-labelledby="trend-heading" className="flex flex-col">
      <PanelHeader
        headingId="trend-heading"
        title="Reliability trend"
        subtitle={`Decisions per day · last ${points.length} days`}
        action={
          <ul className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs text-muted">
            {STACK.map(({ key, swatch }) => (
              <li key={key} className="flex items-center gap-1.5">
                <span aria-hidden className={cn("size-2.5 rounded-sm", swatch)} />
                {key}
              </li>
            ))}
          </ul>
        }
      />

      <div
        role="img"
        aria-label={`Stacked daily PASS, REVIEW and BLOCK decision counts for the last ${points.length} days`}
        className="flex min-h-56 flex-1 gap-2"
      >
        <div aria-hidden className="flex w-8 shrink-0 flex-col text-xs tabular-nums text-faint">
          <div className="relative flex-1">
            {[max, max / 2, 0].map((value, index) => (
              <span
                key={value}
                className={cn(
                  "absolute right-0",
                  index === 0 && "top-0 -translate-y-1/2",
                  index === 1 && "top-1/2 -translate-y-1/2",
                  index === 2 && "bottom-0 translate-y-1/2"
                )}
              >
                {formatInteger(value)}
              </span>
            ))}
          </div>
          {/* Keeps the scale aligned with the plot, not the date row below it. */}
          <span className="mt-1.5 h-4" />
        </div>

        <div aria-hidden className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex flex-1 items-end border-b border-line">
            <span className="absolute inset-x-0 top-0 border-t border-line" />
            <span className="absolute inset-x-0 top-1/2 border-t border-line" />
            {points.map((point, index) => {
              const total = totals[index] ?? 0;
              return (
                <div key={point.date} className="relative flex h-full flex-1 items-end justify-center">
                  <div
                    className="flex w-[62%] flex-col-reverse"
                    style={{ height: percentOf(total, max) }}
                  >
                    {STACK.map(({ key, swatch }) => (
                      <span
                        key={key}
                        className={swatch}
                        style={{ flexGrow: point.counts[key], flexBasis: 0 }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-1.5 flex h-4">
            {points.map((point, index) => (
              <div key={point.date} className="relative flex-1">
                {labelIndexes.has(index) && (
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-faint">
                    {formatShortDate(point.date)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Daily decision counts</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">PASS</th>
            <th scope="col">REVIEW</th>
            <th scope="col">BLOCK</th>
          </tr>
        </thead>
        <tbody>
          {points.map(point => (
            <tr key={point.date}>
              <th scope="row">{point.date}</th>
              <td>{point.counts.PASS}</td>
              <td>{point.counts.REVIEW}</td>
              <td>{point.counts.BLOCK}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
};
