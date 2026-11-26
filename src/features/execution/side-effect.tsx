import { CircleHelp, CircleOff, History, PackagePlus } from "lucide-react";
import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Tag } from "@/components/ui/tag";
import { formatDateTime } from "@/lib/format";
import type { SideEffect } from "@/types";

type SideEffectViewProps = { traceId: string; effect: SideEffect };

/**
 * A side effect is known (created or recovered), definitively absent, or
 * unknown. A yes/no field cannot say "we do not know", so there is none.
 */
export const SideEffectView = ({ traceId, effect }: SideEffectViewProps) => {
  switch (effect.status) {
    case "known_effect": {
      const { origin, resource } = effect;
      const recovered = origin.kind === "recovered";
      return (
        <div className="space-y-2">
          {recovered ? (
            <Tag
              tone="model"
              icon={History}
              title="The tool returned a record that already existed"
            >
              Known effect · recovered
            </Tag>
          ) : (
            <Tag tone="info" icon={PackagePlus} title="This trace created the record">
              Known effect · newly created
            </Tag>
          )}
          <p className="text-sm text-ink">{effect.description}</p>
          <p className="font-mono text-xs text-muted">
            {resource.type} · {resource.id}
          </p>
          {origin.kind === "created" ? (
            <p className="text-xs text-muted">
              Created <time dateTime={origin.createdAt}>{formatDateTime(origin.createdAt)}</time>{" "}
              by this trace.
            </p>
          ) : (
            <p className="text-xs text-muted">
              Existing record, originally created{" "}
              <time dateTime={origin.originallyCreatedAt}>
                {formatDateTime(origin.originallyCreatedAt)}
              </time>
              . Recovered via {origin.recoveredVia}. This trace created nothing new.
            </p>
          )}
          <EvidenceLinks traceId={traceId} eventIds={effect.evidenceEventIds} />
        </div>
      );
    }
    case "no_effect":
      return (
        <div className="space-y-2">
          <Tag tone="neutral" icon={CircleOff} title="Confirmed absence of any side effect">
            No effect · confirmed
          </Tag>
          <p className="text-sm text-muted">{effect.basis}</p>
          <EvidenceLinks traceId={traceId} eventIds={effect.evidenceEventIds} />
        </div>
      );
    case "unknown":
      return (
        <div className="space-y-2">
          <Tag
            tone="review"
            icon={CircleHelp}
            title="Not the same as no effect: the outcome could not be established"
          >
            Effect unknown
          </Tag>
          <p className="text-sm text-muted">{effect.reason}</p>
          <p className="text-xs text-review">
            Treat as possibly created. This is not a confirmed absence.
          </p>
          <EvidenceLinks traceId={traceId} eventIds={effect.evidenceEventIds} />
        </div>
      );
  }
};
