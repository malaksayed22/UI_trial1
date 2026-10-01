import type { Measurement, VersionSet, Viewer } from "@/types";

/**
 * Fixture data used until every backend module is live. Values are
 * illustrative and are labelled as fixtures in the UI.
 */

export const FIXTURE_NOW = "2026-10-01T12:00:00Z";

export const EVALUATOR_SET_VERSION = "evalset-v1.3.0";
export const DATASET_VERSION = "dataset-v1.4.0";
export const POLICY_VERSION = "policy-v1.4";

export const PROCUREMENT_VERSIONS: VersionSet = {
  application: "app-v2.4.1",
  model: "gpt-4.1-mini-v3",
  prompt: "prompt-v1.7.2",
  retriever: "retriever-v2.3.1-ada",
};

export const RAG_VERSIONS: VersionSet = {
  application: "app-v1.9.0",
  model: "gpt-4.1-mini-v3",
  prompt: "prompt-v3.2.0",
  retriever: "retriever-v2.3.1-ada",
};

export const VIEWER: Viewer = {
  name: "Priya K.",
  initials: "PK",
  role: "reviewer",
  permissions: { canReview: true },
};

export const scored = (
  value: number,
  direction: "higher_is_better" | "lower_is_better" = "higher_is_better"
): Measurement => ({ status: "scored", value, direction, range: [0, 1] });

export const notApplicable = (reason: string): Measurement => ({
  status: "not_applicable",
  reason,
});

export const evaluatorFailed = (reason: string): Measurement => ({
  status: "evaluator_failed",
  reason,
});

/** Builds an ISO timestamp for a time on the fixture day. */
export const at = (time: string, date = "2026-10-01") => `${date}T${time}Z`;
