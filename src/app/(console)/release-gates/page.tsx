import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApiErrorNotice } from "@/components/ui/api-error-notice";
import { StateNotice } from "@/components/ui/state-notice";
import { api, settle } from "@/lib/api";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Release Quality Gate" };

/** The gate screen is run-scoped; this entry point opens the latest run. */
const ReleaseGatesIndexPage = async () => {
  const result = await settle(api.listGates());
  if (!result.ok) return <ApiErrorNotice error={result.error} />;

  const latest = [...result.data].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt)
  )[0];
  if (latest) redirect(routes.releaseGate(latest.runId));

  return (
    <StateNotice kind="empty" title="No release-gate runs yet">
      Runs appear here after the CI quality gate evaluates a candidate against the
      approved baseline.
    </StateNotice>
  );
};

export default ReleaseGatesIndexPage;
