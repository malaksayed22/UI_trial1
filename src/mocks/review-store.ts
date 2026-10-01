import { ApiError } from "@/lib/api/errors";
import type { ReviewEntry, ReviewSubmission, Viewer } from "@/types";

/**
 * In-memory, append-only review log used in fixture mode. There is
 * intentionally no update or delete operation, mirroring the audit contract.
 */

type Store = { entries: Map<string, ReviewEntry[]> };

const globalStore = globalThis as typeof globalThis & {
  __trustopsReviewStore?: Store;
};

const store: Store = (globalStore.__trustopsReviewStore ??= {
  entries: new Map(),
});

export const reviewTargetKey = (target: ReviewSubmission["target"]) =>
  target.kind === "trace" ? `trace:${target.traceId}` : `release:${target.runId}`;

const MIN_RATIONALE_LENGTH = 10;

export const appendReview = (
  viewer: Viewer,
  submission: ReviewSubmission,
  now: Date = new Date()
): ReviewEntry => {
  // The backend is the authority on permissions; the UI only mirrors them.
  if (!viewer.permissions.canReview) {
    throw new ApiError("forbidden", "Your role cannot submit reviews.");
  }
  const rationale = submission.rationale.trim();
  if (rationale.length < MIN_RATIONALE_LENGTH) {
    throw new ApiError(
      "invalid",
      `Add a rationale of at least ${MIN_RATIONALE_LENGTH} characters.`
    );
  }

  const key = reviewTargetKey(submission.target);
  const existing = store.entries.get(key) ?? [];
  const entry: ReviewEntry = {
    reviewId: `rev-local-${existing.length + 1}-${now.getTime()}`,
    reviewer: viewer.name,
    role: viewer.role,
    verdict: submission.verdict,
    rationale,
    createdAt: now.toISOString(),
  };
  store.entries.set(key, [entry, ...existing]);
  return entry;
};

/** Entries appended during this session, newest first. */
export const listAppendedReviews = (target: ReviewSubmission["target"]) =>
  store.entries.get(reviewTargetKey(target)) ?? [];

export const resetReviewStore = () => store.entries.clear();
