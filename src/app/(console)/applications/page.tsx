import type { Metadata } from "next";
import { ApiErrorNotice } from "@/components/ui/api-error-notice";
import { PageHeader } from "@/components/ui/page-header";
import { StateNotice } from "@/components/ui/state-notice";
import { ApplicationCard } from "@/features/applications/application-card";
import { api, settle } from "@/lib/api";

export const metadata: Metadata = { title: "Applications" };

const ApplicationsPage = async () => {
  const result = await settle(api.getApplications());
  if (!result.ok) return <ApiErrorNotice error={result.error} />;

  return (
    <>
      <PageHeader
        eyebrow="Screen 02 · Applications"
        title="Applications"
        description="Which versions are currently evaluated, and what did the latest run and gate decide?"
      />
      {result.data.length === 0 ? (
        <StateNotice kind="empty" title="No applications are registered">
          Applications appear here once a trace with version metadata is ingested.
        </StateNotice>
      ) : (
        <div className="space-y-4">
          {result.data.map(application => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </>
  );
};

export default ApplicationsPage;
