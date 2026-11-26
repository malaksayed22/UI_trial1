import { RCA_NOT_ASSESSED_SYNTHETIC_TEXT } from "@/lib/labels";

/**
 * Landing-page stand-in for the Failure & RCA ranking of trace-8f21c9a4. That
 * trace is a synthetic boundary case, so no cause or score is shown.
 */
export const RcaNotAssessed = () => (
  <p className="rounded-xl border border-dashed border-line-strong bg-canvas/50 p-4 text-sm leading-relaxed text-muted">
    {RCA_NOT_ASSESSED_SYNTHETIC_TEXT}
  </p>
);
