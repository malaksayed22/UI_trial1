import { Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { DistributionBar } from "@/components/ui/distribution-bar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatInteger } from "@/lib/format";
import { routes, tracesHref } from "@/lib/routes";
import type { ApplicationSummary } from "@/types";

type ApplicationPulseProps = { applications: ApplicationSummary[] };

export const ApplicationPulse = ({ applications }: ApplicationPulseProps) => (
  <Panel aria-labelledby="application-pulse-heading">
    <PanelHeader
      headingId="application-pulse-heading"
      title="Application pulse"
      subtitle="Latest evaluated configuration · 30 days"
      action={
        <Link href={routes.applications} className="text-sm text-info hover:underline">
          Open inventory
        </Link>
      }
    />
    <div className="grid gap-3 sm:grid-cols-2">
      {applications.map(app => {
        const Icon = app.id === "procurement-agent" ? Bot : Sparkles;
        const latestGate = app.recentGates[0];
        return (
          <article
            key={app.id}
            className="rounded-xl border border-line bg-canvas/40 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-info/30 bg-info/10 text-info">
                <Icon aria-hidden className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium">{app.name}</h3>
                <p className="font-mono text-xs text-faint">{app.versions.application}</p>
              </div>
            </div>
            <p className="mt-4 text-2xl font-semibold tabular-nums">
              {formatInteger(app.traceCount)}
              <span className="ml-1.5 text-xs font-normal text-faint">traces / 30d</span>
            </p>
            <DistributionBar
              counts={app.distribution}
              label={`${app.name} decisions`}
              className="mt-3"
            />
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs">
              {latestGate ? (
                <span className="flex items-center gap-2 text-faint">
                  Latest gate <DecisionBadge decision={latestGate.verdict} size="sm" />
                </span>
              ) : (
                <span className="text-faint">No gate run yet</span>
              )}
              <Link
                href={tracesHref({ application: app.id })}
                className="text-info hover:underline"
              >
                View traces
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  </Panel>
);
