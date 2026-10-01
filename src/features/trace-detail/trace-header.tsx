import { DecisionBadge } from "@/components/ui/decision-badge";
import { VersionChip } from "@/components/ui/version-chip";
import { formatDateTime, formatDuration } from "@/lib/format";
import { describeFailureLabel } from "@/lib/labels";
import type { TraceDetail } from "@/types";

type TraceHeaderProps = { trace: TraceDetail };

export const TraceHeader = ({ trace }: TraceHeaderProps) => {
  const { summary, versions, durationMs } = trace;
  const title =
    summary.failureLabel === "NORMAL"
      ? "Normal execution"
      : describeFailureLabel(summary.failureLabel);

  return (
    <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-faint">
          {summary.traceId} · {summary.applicationName}
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          Started{" "}
          <time dateTime={summary.startedAt}>{formatDateTime(summary.startedAt)}</time>
          {" · "}
          {formatDuration(durationMs)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Versions that produced this trace">
          <VersionChip kind="app" value={versions.application} />
          <VersionChip kind="model" value={versions.model} />
          <VersionChip kind="prompt" value={versions.prompt} />
          {versions.retriever && <VersionChip kind="retriever" value={versions.retriever} />}
        </div>
      </div>
      <div className="flex flex-col items-start gap-1 md:items-end">
        <span className="text-xs text-faint">Reliability decision</span>
        <DecisionBadge decision={summary.decision} size="lg" />
      </div>
    </header>
  );
};
