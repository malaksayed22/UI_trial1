import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatScore } from "@/lib/format";
import { rootCauseText } from "@/lib/labels";
import type { RcaCause } from "@/types";

type RcaRankingProps = { traceId: string; causes: RcaCause[] };

/** Shows the API order and scores exactly; nothing is re-ranked or rescaled. */
export const RcaRanking = ({ traceId, causes }: RcaRankingProps) => (
  <Panel aria-labelledby="rca-heading">
    <PanelHeader
      headingId="rca-heading"
      title="Top-3 root-cause candidates"
      subtitle="Evidence-ranked. Scores are evidence scores, not calibrated probabilities."
    />
    {causes.length === 0 ? (
      <p className="text-sm text-muted">
        No failure was found on this trace, so no root causes are ranked.
      </p>
    ) : (
      <ol className="space-y-4">
        {causes.map(cause => (
          <li key={cause.rank} className="flex gap-3">
            <span className="mt-0.5 font-mono text-sm text-info">
              {String(cause.rank).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-ink">
                  {rootCauseText[cause.causeId]}
                </p>
                <p className="font-mono text-xs text-muted">
                  evidence score{" "}
                  <span className="text-ink tabular-nums">{formatScore(cause.evidenceScore)}</span>
                </p>
              </div>
              <p className="mt-1 text-sm text-muted">{cause.explanation}</p>
              <div className="mt-1.5">
                <EvidenceLinks traceId={traceId} eventIds={cause.evidenceEventIds} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    )}
  </Panel>
);
