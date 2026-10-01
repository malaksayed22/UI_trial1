import { Activity, Ban, SearchCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ApiErrorNotice } from "@/components/ui/api-error-notice";
import { DistributionBar } from "@/components/ui/distribution-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { ApplicationPulse } from "@/features/overview/application-pulse";
import { FailureClasses } from "@/features/overview/failure-classes";
import { RecentGates } from "@/features/overview/recent-gates";
import { ReliabilityTrend } from "@/features/overview/reliability-trend";
import { api, settle } from "@/lib/api";
import { formatInteger, formatPercent } from "@/lib/format";
import { tracesHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Reliability Overview" };

const OverviewPage = async () => {
  const result = await settle(api.getOverview());
  if (!result.ok) return <ApiErrorNotice error={result.error} />;

  const overview = result.data;
  const { PASS, REVIEW, BLOCK } = overview.distribution;
  const needsInvestigation = REVIEW + BLOCK;

  return (
    <>
      <PageHeader
        eyebrow="Screen 01 · Overview"
        title="Reliability Overview"
        description="Where is reliability deteriorating across both reference applications?"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Activity}
          label="Traces evaluated"
          value={formatInteger(overview.traceCount)}
          note={`LAST ${overview.windowDays} DAYS · BOTH APPLICATIONS`}
        />
        <StatCard
          icon={SearchCheck}
          tone="review"
          label="Needs investigation"
          value={formatInteger(needsInvestigation)}
          note={`REVIEW + BLOCK · ${formatPercent(needsInvestigation, overview.traceCount)} OF TRACES`}
        />
        <StatCard
          icon={Ban}
          tone="block"
          label="Blocked actions"
          value={formatInteger(BLOCK)}
          note={
            <Link href={tracesHref({ decision: "BLOCK" })} className="text-info hover:underline">
              VIEW BLOCKED TRACES
            </Link>
          }
        />
      </div>

      <Panel className="mt-4" aria-labelledby="distribution-heading">
        <PanelHeader
          headingId="distribution-heading"
          title="Decision distribution"
          subtitle={`All ${formatInteger(overview.traceCount)} traces · last ${overview.windowDays} days`}
        />
        <DistributionBar
          counts={{ PASS, REVIEW, BLOCK }}
          label="Decision distribution"
        />
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <ReliabilityTrend points={overview.trend} />
        <FailureClasses classes={overview.failureClasses} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ApplicationPulse applications={overview.applications} />
        <RecentGates gates={overview.recentGates} />
      </div>
    </>
  );
};

export default OverviewPage;
