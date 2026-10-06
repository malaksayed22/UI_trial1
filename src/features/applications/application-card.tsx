import { Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { DistributionBar } from "@/components/ui/distribution-bar";
import { Panel } from "@/components/ui/panel";
import { formatDateTime, formatInteger } from "@/lib/format";
import { routes, tracesHref } from "@/lib/routes";
import type { ApplicationSummary } from "@/types";

type ApplicationCardProps = { application: ApplicationSummary };

export const ApplicationCard = ({ application }: ApplicationCardProps) => {
  const { id, name, description, versions, latestRun, recentGates } = application;
  const Icon = id === "procurement-agent" ? Bot : Sparkles;
  const headingId = `${id}-heading`;
  const configuration: [string, string][] = [
    ["Application", versions.application],
    ["Model", versions.model],
    ["Prompt", versions.prompt],
    ["Retriever", versions.retriever ?? "Not used"],
  ];

  return (
    <Panel aria-labelledby={headingId}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-info/30 bg-info/10 text-info">
            <Icon aria-hidden className="size-5" />
          </span>
          <div>
            <h2 id={headingId} className="text-xl font-semibold tracking-tight">
              {name}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted">{description}</p>
          </div>
        </div>
        <div className="md:text-right">
          <p className="font-mono text-xs uppercase tracking-wider text-faint">
            Latest evaluation run
          </p>
          <p className="mt-1 font-mono text-sm text-ink">{latestRun.runId}</p>
          <p className="mt-0.5 text-xs text-muted">
            <time dateTime={latestRun.completedAt}>
              {formatDateTime(latestRun.completedAt)}
            </time>
          </p>
          <p className="mt-0.5 font-mono text-xs text-faint">
            {latestRun.datasetVersion} · {latestRun.evaluatorSetVersion}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {configuration.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-canvas/40 p-3">
            <dt className="font-mono text-xs uppercase tracking-wider text-faint">
              {label}
            </dt>
            <dd className="mt-1.5 break-all font-mono text-xs text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-6 border-t border-line pt-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium">
            Trace decisions · {formatInteger(application.traceCount)} traces, 30 days
          </h3>
          <DistributionBar
            counts={application.distribution}
            label={`${name} decisions`}
          />
          <Link
            href={tracesHref({ application: id })}
            className="mt-4 inline-block text-sm text-info hover:underline"
          >
            View {name} traces
          </Link>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium">Most recent gate decisions</h3>
          <ul className="space-y-1">
            {recentGates.map(gate => (
              <li key={gate.runId}>
                <Link
                  href={routes.releaseGate(gate.runId)}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-1.5 py-2 hover:bg-raised"
                >
                  <DecisionBadge decision={gate.verdict} size="sm" />
                  <span className="font-mono text-sm">{gate.candidateLabel}</span>
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
        </div>
      </div>
    </Panel>
  );
};
