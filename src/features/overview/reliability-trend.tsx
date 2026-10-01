import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatInteger, formatShortDate } from "@/lib/format";
import type { Decision, TrendPoint } from "@/types";

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { left: 40, right: 8, top: 8, bottom: 26 };
const STACK: { key: Decision; fill: string }[] = [
  { key: "PASS", fill: "var(--color-pass)" },
  { key: "REVIEW", fill: "var(--color-review)" },
  { key: "BLOCK", fill: "var(--color-block)" },
];

const niceCeiling = (value: number) => Math.ceil(value / 50) * 50;

type ReliabilityTrendProps = { points: TrendPoint[] };

/**
 * Daily decision volume as stacked columns. The same numbers are exposed as a
 * table for assistive technology, and each series is named in the legend.
 */
export const ReliabilityTrend = ({ points }: ReliabilityTrendProps) => {
  const totals = points.map(p => p.counts.PASS + p.counts.REVIEW + p.counts.BLOCK);
  const max = niceCeiling(Math.max(1, ...totals));
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotWidth / Math.max(points.length, 1);
  const barWidth = slot * 0.62;
  const y = (value: number) => PAD.top + plotHeight - (value / max) * plotHeight;
  const gridValues = [0, max / 2, max];
  const labelIndexes = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <Panel aria-labelledby="trend-heading">
      <PanelHeader
        headingId="trend-heading"
        title="Reliability trend"
        subtitle={`Decisions per day · last ${points.length} days`}
        action={
          <ul className="flex gap-4 text-xs text-muted">
            {STACK.map(({ key, fill }) => (
              <li key={key} className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-sm" style={{ background: fill }} />
                {key}
              </li>
            ))}
          </ul>
        }
      />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Stacked daily PASS, REVIEW and BLOCK decision counts for the last ${points.length} days`}
        className="h-auto w-full"
      >
        {gridValues.map(value => (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(value)}
              y2={y(value)}
              stroke="var(--color-line)"
            />
            <text
              x={PAD.left - 6}
              y={y(value) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-faint)"
            >
              {formatInteger(value)}
            </text>
          </g>
        ))}
        {points.map((point, index) => {
          let offset = 0;
          return (
            <g key={point.date}>
              {STACK.map(({ key, fill }) => {
                const count = point.counts[key];
                const top = y(offset + count);
                const height = y(offset) - top;
                offset += count;
                return (
                  <rect
                    key={key}
                    x={PAD.left + index * slot + (slot - barWidth) / 2}
                    y={top}
                    width={barWidth}
                    height={Math.max(height, 0)}
                    fill={fill}
                  />
                );
              })}
              {labelIndexes.has(index) && (
                <text
                  x={PAD.left + index * slot + slot / 2}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--color-faint)"
                >
                  {formatShortDate(point.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
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
