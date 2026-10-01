"use server";

import { revalidatePath } from "next/cache";
import { api, isApiError } from "@/lib/api";
import { routes } from "@/lib/routes";
import type { ReviewTarget, ReviewVerdict } from "@/types";
import type { ReviewFormState } from "./review-state";

const verdicts: readonly ReviewVerdict[] = ["ACCEPT", "REVIEW", "BLOCK"];

const isVerdict = (value: unknown): value is ReviewVerdict =>
  verdicts.includes(value as ReviewVerdict);

const readTarget = (formData: FormData): ReviewTarget | null => {
  const kind = formData.get("targetKind");
  const id = formData.get("targetId");
  if (typeof id !== "string" || !id) return null;
  if (kind === "trace") return { kind, traceId: id };
  if (kind === "release") return { kind, runId: id };
  return null;
};

const pathForTarget = (target: ReviewTarget) =>
  target.kind === "trace"
    ? routes.investigation(target.traceId)
    : routes.releaseGate(target.runId);

/**
 * Submits a human review. The backend decides whether the caller may review
 * and appends the entry; this action only validates shape and refreshes.
 */
export const submitReviewAction = async (
  _previous: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> => {
  const verdict = formData.get("verdict");
  const rationale = String(formData.get("rationale") ?? "");
  const target = readTarget(formData);

  if (!target || !isVerdict(verdict)) {
    return {
      status: "error",
      message: "The review could not be read. Reload the page and try again.",
      values: { verdict: "ACCEPT", rationale },
    };
  }

  try {
    await api.submitReview({ target, verdict, rationale });
  } catch (error) {
    const message = isApiError(error)
      ? error.message
      : "The review could not be saved. Try again.";
    return { status: "error", message, values: { verdict, rationale } };
  }

  revalidatePath(pathForTarget(target));
  return {
    status: "success",
    message: "Review recorded. It was added to the history without changing the machine decision.",
    values: { verdict, rationale: "" },
  };
};
