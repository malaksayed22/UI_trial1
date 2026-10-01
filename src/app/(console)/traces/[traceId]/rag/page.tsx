import type { Metadata } from "next";
import { ApiErrorNotice } from "@/components/ui/api-error-notice";
import { PageHeader } from "@/components/ui/page-header";
import { VersionChip } from "@/components/ui/version-chip";
import {
  CitationsPanel,
  ExpectedEvidencePanel,
  FailureModePanel,
  MetricsPanel,
} from "@/features/rag/evidence-checks";
import { QueryAndAnswer } from "@/features/rag/query-and-answer";
import { RetrievalTable } from "@/features/rag/retrieval-table";
import { BackToExplorer } from "@/features/trace-detail/back-to-explorer";
import { TraceTabs } from "@/features/trace-detail/trace-tabs";
import { api, settle } from "@/lib/api";
import { routes } from "@/lib/routes";

type RagPageProps = { params: Promise<{ traceId: string }> };

export const generateMetadata = async ({ params }: RagPageProps): Promise<Metadata> => ({
  title: `RAG Diagnostics · ${decodeURIComponent((await params).traceId)}`,
});

const RagDiagnosticsPage = async ({ params }: RagPageProps) => {
  const traceId = decodeURIComponent((await params).traceId);
  const result = await settle(api.getRagDiagnostics(traceId));

  if (!result.ok) {
    return (
      <>
        <BackToExplorer />
        <TraceTabs traceId={traceId} current="rag" />
        <ApiErrorNotice
          error={result.error}
          back={{ href: routes.trace(traceId), label: "Back to Trace Detail" }}
        />
      </>
    );
  }

  const diagnostics = result.data;

  return (
    <>
      <BackToExplorer />
      <PageHeader
        eyebrow="Screen 05 · RAG Diagnostics"
        title="RAG Diagnostics"
        description="Did retrieval and the cited evidence actually support the answer?"
        actions={
          <div className="flex flex-wrap gap-2">
            <VersionChip kind="trace" value={diagnostics.traceId} />
            <VersionChip kind="retriever" value={diagnostics.retrieverVersion} />
          </div>
        }
      />
      <TraceTabs traceId={traceId} current="rag" />

      <div className="space-y-4">
        <QueryAndAnswer diagnostics={diagnostics} />
        <FailureModePanel diagnostics={diagnostics} />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <RetrievalTable
              documents={diagnostics.documents}
              retrieverVersion={diagnostics.retrieverVersion}
              k={diagnostics.k}
            />
            <CitationsPanel citations={diagnostics.citations} />
          </div>
          <div className="space-y-4">
            <ExpectedEvidencePanel items={diagnostics.expectedEvidence} />
            <MetricsPanel diagnostics={diagnostics} />
          </div>
        </div>
      </div>
    </>
  );
};

export default RagDiagnosticsPage;
