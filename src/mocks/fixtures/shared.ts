import type { Measurement, TextSpan, VersionSet, Viewer } from "@/types";

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

/** Locates `phrase` in `text`. Throws so a typo in a fixture fails loudly. */
export const spanOf = (text: string, phrase: string): TextSpan => {
  const start = text.indexOf(phrase);
  if (start === -1) throw new Error(`Fixture phrase not found: ${phrase}`);
  return { start, end: start + phrase.length };
};

/** Span from the start of `from` to the end of `to`, both found in `text`. */
export const spanBetween = (text: string, from: string, to: string): TextSpan => {
  const start = spanOf(text, from).start;
  return { start, end: spanOf(text, to).end };
};

/**
 * PROC-SUPPLIER-01 checks the matching supplier record's APPROVED status,
 * independent of order value. Every trace uses this wording. The rule name is
 * illustrative: only the meaning is confirmed (Nour).
 */
export const SUPPLIER_RULE = "supplier_must_be_approved";
export const SUPPLIER_RULE_DESCRIPTION =
  "The supplier on the proposed purchase order must match a supplier record with status APPROVED, regardless of order value.";

/** FIXTURE value, application-local, pending Mohab's canonical mapping. */
export const SUPPLIER_SOURCE = "Supplier directory (fixture snapshot)";

/** SYNTHETIC record version. Not issued by a real supplier directory. */
export const SYNTHETIC_RECORD_VERSION = "v1";
