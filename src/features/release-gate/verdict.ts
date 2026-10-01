import type { GateRun, GateVerdict } from "@/types";

/**
 * A run that did not complete can never present as PASS, even if the payload
 * carries a verdict. Defence in depth for the "incomplete is not a pass" rule.
 */
export const effectiveVerdict = (run: Pick<GateRun, "status" | "verdict">): GateVerdict =>
  run.status === "complete" ? run.verdict : "INCOMPLETE";

export const verdictExplanation = (verdict: GateVerdict): string => {
  switch (verdict) {
    case "BLOCK":
      return "BLOCK retains the current approved baseline. The candidate is not promoted until the regression is resolved. No rollback or deployment is triggered from this screen.";
    case "REVIEW":
      return "REVIEW requires human interpretation before any decision. It is not an approval and does not promote the candidate.";
    case "PASS":
      return "All compared metrics are within tolerance and no critical failure was found. Promotion remains a separate, deliberate step.";
    case "INCOMPLETE":
      return "The evaluation did not finish, so no verdict can be trusted. An incomplete or failed run is never treated as a PASS.";
  }
};
