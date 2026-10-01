import type { Metadata } from "next";
import { ApiErrorNotice } from "@/components/ui/api-error-notice";
import { PageHeader } from "@/components/ui/page-header";
import { EvaluatorEvidence } from "@/features/evidence/evaluator-evidence";
import { PolicyFindings } from "@/features/evidence/policy-findings";
import { SecurityFindings } from "@/features/evidence/security-findings";
import { DecisionPath } from "@/features/investigation/decision-path";
import { PrimaryFailure } from "@/features/investigation/primary-failure";
import { RcaRanking } from "@/features/investigation/rca-ranking";
import { ReviewSection } from "@/features/review/review-section";
import { BackToExplorer } from "@/features/trace-detail/back-to-explorer";
import { TraceTabs } from "@/features/trace-detail/trace-tabs";
import { api, settle } from "@/lib/api";
import { routes } from "@/lib/routes";

type InvestigationPageProps = { params: Promise<{ traceId: string }> };

export const generateMetadata = async ({
  params,
}: InvestigationPageProps): Promise<Metadata> => ({
  title: `Failure & RCA · ${decodeURIComponent((await params).traceId)}`,
});

const InvestigationPage = async ({ params }: InvestigationPageProps) => {
  const traceId = decodeURIComponent((await params).traceId);
  const [result, viewer] = await Promise.all([
    settle(api.getInvestigation(traceId)),
    settle(api.getViewer()),
  ]);

  if (!result.ok) {
    return (
      <>
        <BackToExplorer />
        <TraceTabs traceId={traceId} current="investigation" />
        <ApiErrorNotice
          error={result.error}
          back={{ href: routes.trace(traceId), label: "Back to Trace Detail" }}
        />
      </>
    );
  }

  const investigation = result.data;

  return (
    <>
      <BackToExplorer />
      <PageHeader
        eyebrow="Screen 06 · Failure & RCA"
        title="Failure & RCA Investigation"
        description="What failed, why did it fail, and what decision followed?"
      />
      <TraceTabs traceId={traceId} current="investigation" />

      <div className="space-y-4">
        <PrimaryFailure investigation={investigation} />

        <div className="grid gap-4 lg:grid-cols-2">
          <RcaRanking traceId={traceId} causes={investigation.rca} />
          <DecisionPath traceId={traceId} steps={investigation.decisionPath} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PolicyFindings
            traceId={traceId}
            findings={investigation.ruleFindings}
            title="Rule findings"
            subtitle="Deterministic checks, separate from the classifier and RCA"
            headingId="rule-findings"
          />
          <SecurityFindings traceId={traceId} findings={investigation.securityFindings} />
        </div>

        <EvaluatorEvidence traceId={traceId} results={investigation.evaluatorEvidence} />

        <ReviewSection
          target={{ kind: "trace", traceId }}
          machineDecision={investigation.decision}
          history={investigation.reviewHistory}
          viewer={viewer.ok ? viewer.data : null}
        />
      </div>
    </>
  );
};

export default InvestigationPage;
