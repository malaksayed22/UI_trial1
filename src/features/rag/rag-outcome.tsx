import { CheckCircle2, MessageSquareOff, ServerCrash } from "lucide-react";
import { Tag } from "@/components/ui/tag";
import type { RagOutcome } from "@/types";

/** Answered, abstained and technically failed are three different outcomes. */
export const RagOutcomeTag = ({ outcome }: { outcome: RagOutcome }) => {
  switch (outcome.kind) {
    case "answered":
      return <Tag tone="neutral" icon={CheckCircle2}>Answered</Tag>;
    case "abstained":
      return (
        <Tag tone="info" icon={MessageSquareOff} title="The system chose not to answer">
          Abstained
        </Tag>
      );
    case "technical_failure":
      return (
        <Tag tone="block" icon={ServerCrash} title="A provider fault stopped the pipeline">
          Technical failure
        </Tag>
      );
  }
};

/**
 * Explains a non-answer. An abstention is a decision the system made. A
 * technical failure is a fault. The two must never be read as each other.
 */
export const RagOutcomeNotice = ({ outcome }: { outcome: RagOutcome }) => {
  switch (outcome.kind) {
    case "answered":
      return null;
    case "abstained":
      return (
        <div role="note" className="mt-3 rounded-lg border border-info/40 bg-info/10 p-3 text-sm">
          <p className="font-medium text-info">Abstained on purpose</p>
          <p className="mt-1 text-muted">{outcome.reason}</p>
          <p className="mt-2 text-xs text-faint">
            This is not a retrieval or provider failure. Declining to answer when the evidence is
            insufficient is a valid response.
          </p>
        </div>
      );
    case "technical_failure":
      return (
        <div role="alert" className="mt-3 rounded-lg border border-block/40 bg-block/10 p-3 text-sm">
          <p className="font-medium text-block">
            Technical failure at the {outcome.stage} stage
          </p>
          <p className="mt-1 text-muted">{outcome.message}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-faint">Provider</dt>
              <dd className="mt-0.5 font-mono text-muted">{outcome.provider}</dd>
            </div>
            <div>
              <dt className="text-faint">Error code</dt>
              <dd className="mt-0.5 font-mono text-muted">{outcome.code}</dd>
            </div>
            <div>
              <dt className="text-faint">Retry</dt>
              <dd className="mt-0.5 text-muted">
                {outcome.retryable ? "Safe to retry" : "Not retryable"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-faint">
            This is not an abstention and not a quality result. Nothing can be concluded about
            retrieval or answer quality from this trace.
          </p>
        </div>
      );
  }
};
