import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatPercent } from "@/lib/format";
import { describeFailureLabel } from "@/lib/labels";
import { tracesHref } from "@/lib/routes";
import type { FailureClassCount } from "@/types";

type FailureClassesProps = { classes: FailureClassCount[] };

export const FailureClasses = ({ classes }: FailureClassesProps) => {
  const total = classes.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(1, ...classes.map(item => item.count));

  return (
    <Panel aria-labelledby="failure-classes-heading">
      <PanelHeader
        headingId="failure-classes-heading"
        title="Top failure classes"
        subtitle="Primary label of traces that need investigation · 30 days"
        action={
          <Link href={tracesHref()} className="text-sm text-info hover:underline">
            View all traces
          </Link>
        }
      />
      <ol className="space-y-3">
        {classes.map((item, index) => (
          <li key={item.label}>
            <Link
              href={tracesHref({ failureLabel: item.label })}
              className="group block rounded-md p-1.5 hover:bg-raised"
            >
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted group-hover:text-ink">
                  <span className="mr-2 font-mono text-xs text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {describeFailureLabel(item.label)}
                </span>
                <span className="font-mono text-xs text-muted tabular-nums">
                  {item.count}
                  <span className="text-faint"> · {formatPercent(item.count, total)}</span>
                </span>
              </span>
              <span
                aria-hidden
                className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-raised"
              >
                <span
                  className="block h-full rounded-full bg-info"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
};
