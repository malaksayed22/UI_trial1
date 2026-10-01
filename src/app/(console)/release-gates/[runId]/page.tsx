import type { Metadata } from "next";
import { ApiErrorNotice } from "@/components/ui/api-error-notice";
import { PageHeader } from "@/components/ui/page-header";
import { RecentGates } from "@/features/overview/recent-gates";
import { CriticalCases } from "@/features/release-gate/critical-cases";
import { GateVerdictPanel } from "@/features/release-gate/gate-verdict";
import { MetricDeltaTable } from "@/features/release-gate/metric-delta-table";
import { VersionComparison } from "@/features/release-gate/version-comparison";
import { effectiveVerdict } from "@/features/release-gate/verdict";
import { ReviewSection } from "@/features/review/review-section";
import { api, settle } from "@/lib/api";
import { routes } from "@/lib/routes";

type GatePageProps = { params: Promise<{ runId: string }> };

export const generateMetadata = async ({ params }: GatePageProps): Promise<Metadata> => ({
  title: `Release Quality Gate · ${decodeURIComponent((await params).runId)}`,
});

const ReleaseGatePage = async ({ params }: GatePageProps) => {
  const runId = decodeURIComponent((await params).runId);
  const [result, gates, viewer] = await Promise.all([
    settle(api.getGate(runId)),
    settle(api.listGates()),
    settle(api.getViewer()),
  ]);

  const header = (
    <PageHeader
      eyebrow="Screen 07 · Release Quality Gate"
      title="Release Quality Gate"
      description="Should this candidate replace the last approved baseline?"
    />
  );

  if (!result.ok) {
    return (
      <>
        {header}
        <ApiErrorNotice
          error={result.error}
          back={{ href: routes.releaseGates, label: "Open the latest gate run" }}
        />
      </>
    );
  }

  const run = result.data;

  return (
    <>
      {header}
      <div className="space-y-4">
        <GateVerdictPanel run={run} />
        <VersionComparison
          baseline={run.baseline}
          candidate={run.candidate}
          datasetVersion={run.datasetVersion}
          evaluatorSetVersion={run.evaluatorSetVersion}
        />
        <MetricDeltaTable
          metrics={run.metrics}
          datasetVersion={run.datasetVersion}
          traceCount={run.traceCount}
        />
        <CriticalCases cases={run.criticalCases} />
        <ReviewSection
          target={{ kind: "release", runId: run.runId }}
          machineDecision={effectiveVerdict(run)}
          history={run.reviewHistory}
          viewer={viewer.ok ? viewer.data : null}
        />
        {gates.ok && (
          <RecentGates
            gates={gates.data}
            title="Gate history"
            subtitle="Other candidate evaluations"
            headingId="gate-history-heading"
          />
        )}
      </div>
    </>
  );
};

export default ReleaseGatePage;
