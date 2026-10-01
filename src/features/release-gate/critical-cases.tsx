import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { routes } from "@/lib/routes";
import type { CriticalCase } from "@/types";

type CriticalCasesProps = { cases: CriticalCase[] };

export const CriticalCases = ({ cases }: CriticalCasesProps) => (
  <Panel aria-labelledby="critical-heading">
    <PanelHeader
      headingId="critical-heading"
      title="Critical cases"
      subtitle="Trace-level evidence behind the verdict"
    />
    {cases.length === 0 ? (
      <p className="text-sm text-muted">
        No critical cases were reported for this run.
      </p>
    ) : (
      <ul className="space-y-2">
        {cases.map(item => (
          <li key={`${item.traceId}-${item.title}`}>
            <Link
              href={routes.trace(item.traceId)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-3 hover:border-info/50"
            >
              <span>
                <span className="block text-sm text-ink">{item.title}</span>
                <span className="mt-0.5 block text-xs text-faint">
                  {item.affected} of {item.total} cases affected
                </span>
              </span>
              <span className="font-mono text-xs text-info">
                Open {item.traceId} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </Panel>
);
