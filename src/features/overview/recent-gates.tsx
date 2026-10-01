import Link from "next/link";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { GateSummary } from "@/types";

type RecentGatesProps = {
  gates: GateSummary[];
  title?: string;
  subtitle?: string;
  headingId?: string;
};

export const RecentGates = ({
  gates,
  title = "Recent release gates",
  subtitle = "Latest candidate decisions",
  headingId = "recent-gates-heading",
}: RecentGatesProps) => (
  <Panel aria-labelledby={headingId}>
    <PanelHeader
      headingId={headingId}
      title={title}
      subtitle={subtitle}
      action={
        <Link href={routes.releaseGates} className="text-sm text-info hover:underline">
          Open latest gate
        </Link>
      }
    />
    <ul className="divide-y divide-line">
      {gates.map(gate => (
        <li key={gate.runId}>
          <Link
            href={routes.releaseGate(gate.runId)}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-1.5 py-2.5 hover:bg-raised"
          >
            <DecisionBadge decision={gate.verdict} size="sm" />
            <span className="font-mono text-sm text-ink">{gate.candidateLabel}</span>
            <time
              dateTime={gate.completedAt}
              className="ml-auto font-mono text-xs text-faint"
            >
              {formatDateTime(gate.completedAt)}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  </Panel>
);
