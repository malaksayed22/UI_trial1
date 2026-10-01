import type { ReviewVerdict } from "@/types";

export type ReviewFormState = {
  status: "idle" | "success" | "error";
  message: string;
  values: { verdict: ReviewVerdict; rationale: string };
};

export const initialReviewState: ReviewFormState = {
  status: "idle",
  message: "",
  values: { verdict: "ACCEPT", rationale: "" },
};
