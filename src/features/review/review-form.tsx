"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import type { ReviewTarget, ReviewVerdict } from "@/types";
import { submitReviewAction } from "./actions";
import { initialReviewState } from "./review-state";

const verdictOptions: { value: ReviewVerdict; label: string; hint: string }[] = [
  { value: "ACCEPT", label: "Accept", hint: "Agree the outcome is acceptable" },
  { value: "REVIEW", label: "Review", hint: "Needs further investigation" },
  { value: "BLOCK", label: "Block", hint: "Confirm the action should be blocked" },
];

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-info/40 bg-info/15 px-4 py-2 text-sm font-medium text-info transition-colors hover:bg-info/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Submit review"}
    </button>
  );
};

type ReviewFormProps = { target: ReviewTarget };

export const ReviewForm = ({ target }: ReviewFormProps) => {
  const [state, action] = useActionState(submitReviewAction, initialReviewState);
  const targetId = target.kind === "trace" ? target.traceId : target.runId;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="targetKind" value={target.kind} />
      <input type="hidden" name="targetId" value={targetId} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Your verdict</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {verdictOptions.map(option => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-line-strong bg-canvas/40 p-3 text-sm has-[:checked]:border-info/60 has-[:checked]:bg-info/10"
            >
              <input
                type="radio"
                name="verdict"
                value={option.value}
                defaultChecked={state.values.verdict === option.value}
                className="mt-1 accent-[var(--color-info)]"
              />
              <span>
                <span className="block font-medium text-ink">{option.label}</span>
                <span className="block text-xs text-faint">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-rationale" className="mb-1.5 block text-sm font-medium text-ink">
          Rationale
        </label>
        <textarea
          id="review-rationale"
          name="rationale"
          required
          minLength={10}
          rows={3}
          defaultValue={state.values.rationale}
          placeholder="Explain what evidence supports your verdict"
          className="w-full rounded-lg border border-line-strong bg-canvas/60 px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-info/60"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        {state.status !== "idle" && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={cn(
              "text-sm",
              state.status === "error" ? "text-block" : "text-pass"
            )}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
};
