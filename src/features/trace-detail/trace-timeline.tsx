import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { formatClock, formatDuration } from "@/lib/format";
import type { TraceDetail } from "@/types";
import { eventFields, presentEvent } from "./event-presenter";

type TraceTimelineProps = { trace: TraceDetail };

const markerTone = {
  pass: "border-pass/50 text-pass",
  review: "border-review/50 text-review",
  block: "border-block/50 text-block",
  info: "border-info/50 text-info",
  model: "border-model/50 text-model",
  neutral: "border-line-strong text-muted",
} as const;

export const TraceTimeline = ({ trace }: TraceTimelineProps) => {
  const events = [...trace.events].sort((a, b) => a.sequence - b.sequence);
  const nodeByEvent = new Map(
    trace.graph.nodes.flatMap(node =>
      node.eventId ? [[node.eventId, node.nodeId] as const] : []
    )
  );

  return (
    <Panel aria-labelledby="timeline-heading">
      <PanelHeader
        headingId="timeline-heading"
        title="Ordered execution timeline"
        subtitle={`${events.length} events · ${formatDuration(trace.durationMs)} total`}
      />
      <ol>
        {events.map((event, index) => {
          const view = presentEvent(event);
          const Icon = view.icon;
          const nodeId = nodeByEvent.get(event.eventId);
          return (
            <li
              key={event.eventId}
              id={`event-${event.eventId}`}
              className="relative flex gap-3 px-2 py-1"
            >
              {index < events.length - 1 && (
                <span aria-hidden className="absolute bottom-0 left-[1.1rem] top-9 w-px bg-line-strong" />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 mt-2 flex size-6 shrink-0 items-center justify-center rounded-full border bg-surface font-mono text-xs",
                  markerTone[view.tone]
                )}
              >
                {event.sequence}
              </span>
              <div className="min-w-0 flex-1 pb-4 pt-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <time dateTime={event.timestamp} className="font-mono text-xs text-faint">
                    {formatClock(event.timestamp, true)}
                  </time>
                  <Tag tone={view.tone} icon={Icon}>{view.label}</Tag>
                </div>
                <p className="mt-1.5 break-words text-sm text-ink">{view.headline}</p>
                {view.facts.length > 0 && (
                  <p className="mt-1 break-words font-mono text-xs text-faint">
                    {view.facts.join(" · ")}
                  </p>
                )}
                <details className="group mt-2">
                  <summary className="cursor-pointer text-xs text-info hover:underline">
                    Event details
                  </summary>
                  <dl className="mt-2 grid gap-x-4 gap-y-1.5 rounded-lg border border-line bg-canvas/40 p-3 text-xs sm:grid-cols-[9rem_1fr]">
                    {eventFields(event).map(([key, value]) => (
                      <div key={`${key}-${value}`} className="contents">
                        <dt className="text-faint">{key}</dt>
                        <dd className="break-words font-mono text-muted">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
                {nodeId && (
                  <Link
                    href={`#graph-${nodeId}`}
                    className="mt-2 inline-block text-xs text-info hover:underline"
                  >
                    Show in graph
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
};
