import Link from "next/link";
import { traceEventHref } from "@/lib/routes";

type EvidenceLinksProps = {
  traceId: string;
  eventIds: string[];
  /** Shown when there is no supporting event. */
  emptyLabel?: string;
};

/** Deep links from a finding, cause or verdict to its supporting timeline event. */
export const EvidenceLinks = ({
  traceId,
  eventIds,
  emptyLabel = "No linked events",
}: EvidenceLinksProps) => {
  if (eventIds.length === 0) {
    return <span className="text-xs text-faint">{emptyLabel}</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-faint">Evidence</span>
      {eventIds.map(eventId => (
        <Link
          key={eventId}
          href={traceEventHref(traceId, eventId)}
          className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-info hover:border-info/60 hover:bg-info/10"
        >
          {eventId}
        </Link>
      ))}
    </span>
  );
};
