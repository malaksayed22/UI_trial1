import type { Metadata } from "next";
import Link from "next/link";
import { ApiErrorNotice } from "@/components/ui/api-error-notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EvaluatorEvidence } from "@/features/evidence/evaluator-evidence";
import { PolicyFindings } from "@/features/evidence/policy-findings";
import { SecurityFindings } from "@/features/evidence/security-findings";
import { TraceGraph } from "@/features/trace-graph/trace-graph";
import { BackToExplorer } from "@/features/trace-detail/back-to-explorer";
import { TraceHeader } from "@/features/trace-detail/trace-header";
import { TraceTabs } from "@/features/trace-detail/trace-tabs";
import { TraceTimeline } from "@/features/trace-detail/trace-timeline";
import { api, settle } from "@/lib/api";
import { routes } from "@/lib/routes";

type TraceDetailPageProps = { params: Promise<{ traceId: string }> };

export const generateMetadata = async ({
  params,
}: TraceDetailPageProps): Promise<Metadata> => ({
  title: `Trace ${decodeURIComponent((await params).traceId)}`,
});

const TraceDetailPage = async ({ params }: TraceDetailPageProps) => {
  const traceId = decodeURIComponent((await params).traceId);
  const result = await settle(api.getTrace(traceId));

  if (!result.ok) {
    return (
      <>
        <BackToExplorer />
        <ApiErrorNotice
          error={result.error}
          back={{ href: routes.traces, label: "Open the Trace Explorer" }}
        />
      </>
    );
  }

  const trace = result.data;
  const { rag, investigation } = trace.availableViews;

  return (
    <>
      <BackToExplorer />
      <TraceHeader trace={trace} />
      <TraceTabs traceId={traceId} current="detail" />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <TraceTimeline trace={trace} />
        <TraceGraph traceId={traceId} graph={trace.graph} />
      </div>

      <div className="mt-4 space-y-4">
        <EvaluatorEvidence traceId={traceId} results={trace.evaluators} />
        <div className="grid gap-4 lg:grid-cols-2">
          <PolicyFindings traceId={traceId} findings={trace.policyFindings} />
          <SecurityFindings traceId={traceId} findings={trace.securityFindings} />
        </div>

        <Panel aria-labelledby="next-steps-heading">
          <PanelHeader
            headingId="next-steps-heading"
            title="Continue the investigation"
            subtitle="Open the diagnostic views that apply to this trace"
          />
          <ul className="flex flex-wrap gap-3 text-sm">
            {rag && (
              <li>
                <Link
                  href={routes.rag(traceId)}
                  className="rounded-lg border border-line-strong px-3 py-2 text-info hover:bg-raised"
                >
                  RAG Diagnostics
                </Link>
              </li>
            )}
            {investigation && (
              <li>
                <Link
                  href={routes.investigation(traceId)}
                  className="rounded-lg border border-line-strong px-3 py-2 text-info hover:bg-raised"
                >
                  Failure &amp; RCA Investigation
                </Link>
              </li>
            )}
            {!rag && (
              <li className="px-1 py-2 text-faint">
                RAG Diagnostics does not apply to this trace.
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </>
  );
};

export default TraceDetailPage;
