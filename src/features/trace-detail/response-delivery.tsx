import { CheckCircle2, CircleHelp, CircleSlash, Equal, EyeOff, PencilLine, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag, type TagTone } from "@/components/ui/tag";
import { deliveryDispositionText } from "@/lib/labels";
import type { ActionReference, DeliveryDisposition, ResponseDelivery } from "@/types";

const dispositionView = {
  unchanged: { tone: "neutral", icon: Equal },
  corrected: { tone: "review", icon: PencilLine },
  suppressed: { tone: "block", icon: EyeOff },
  no_candidate: { tone: "neutral", icon: CircleSlash },
} as const satisfies Record<DeliveryDisposition, { tone: TagTone; icon: LucideIcon }>;

const consistencyView = {
  consistent: { tone: "pass", icon: CheckCircle2, label: "Matches the action record" },
  contradicted: { tone: "block", icon: XCircle, label: "Contradicts the action record" },
  unverified: { tone: "review", icon: CircleHelp, label: "Cannot be verified" },
} as const satisfies Record<
  ActionReference["consistency"],
  { tone: TagTone; icon: LucideIcon; label: string }
>;

const ActionRefs = ({ refs }: { refs: ActionReference[] }) => {
  if (refs.length === 0) {
    return <p className="text-xs text-faint">References no recorded action.</p>;
  }
  return (
    <ul className="space-y-2">
      {refs.map(ref => {
        const view = consistencyView[ref.consistency];
        return (
          <li key={`${ref.actionId}-${ref.claim}`} className="text-sm">
            <p className="text-muted">
              Claims: {ref.claim}{" "}
              <a
                href={`#action-${ref.actionId}`}
                className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-xs text-info hover:border-info/60 hover:bg-info/10"
              >
                {ref.actionId}
              </a>
            </p>
            <div className="mt-1">
              <Tag tone={view.tone} icon={view.icon}>{view.label}</Tag>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

type ColumnProps = { heading: string; tone: "model" | "line"; children: ReactNode };

const Column = ({ heading, tone, children }: ColumnProps) => (
  <section
    aria-label={heading}
    className={`rounded-xl border bg-canvas/40 p-4 ${tone === "model" ? "border-model/40" : "border-line-strong"}`}
  >
    <h3
      className={`font-mono text-xs uppercase tracking-wider ${tone === "model" ? "text-model" : "text-muted"}`}
    >
      {heading}
    </h3>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
);

type ResponseDeliveryPanelProps = { traceId: string; delivery: ResponseDelivery };

/**
 * The model's raw candidate and the response that reached the user are
 * recorded separately. The response gate may deliver, correct or withhold the
 * candidate, and the action record decides whether each claim holds.
 */
export const ResponseDeliveryPanel = ({ traceId, delivery }: ResponseDeliveryPanelProps) => {
  const { disposition, rawCandidate, delivered, interventions } = delivery;
  const view = dispositionView[disposition];

  return (
    <Panel aria-labelledby="delivery-heading">
      <PanelHeader
        headingId="delivery-heading"
        title="Raw candidate and delivered response"
        subtitle="What the model wrote, and what the response gate actually sent."
        action={
          <Tag tone={view.tone} icon={view.icon}>
            {deliveryDispositionText[disposition]}
          </Tag>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Column heading="Raw model candidate" tone="model">
          {rawCandidate ? (
            <>
              <blockquote className="border-l-2 border-model/60 pl-3 text-sm leading-6 text-ink">
                “{rawCandidate.text}”
              </blockquote>
              <ActionRefs refs={rawCandidate.actionRefs} />
            </>
          ) : (
            <p className="text-sm text-muted">
              The model produced no candidate. The system sent a fallback notice instead.
            </p>
          )}
        </Column>
        <Column heading="Delivered response" tone="line">
          <blockquote className="border-l-2 border-info/60 pl-3 text-sm leading-6 text-ink">
            “{delivered.text}”
          </blockquote>
          {disposition === "unchanged" && (
            <p className="text-xs text-faint">Identical to the raw candidate.</p>
          )}
          <ActionRefs refs={delivered.actionRefs} />
        </Column>
      </div>

      {interventions.length > 0 && (
        <div className="mt-4 rounded-lg border border-review/40 bg-review/10 p-3">
          <p className="text-sm font-medium text-review">Response gate intervention</p>
          <ul className="mt-2 space-y-3">
            {interventions.map(intervention => (
              <li key={intervention.reason} className="space-y-1.5 text-sm text-muted">
                <p>{intervention.reason}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {intervention.policyFindingIds.length > 0 && (
                    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-faint">Policy</span>
                      {intervention.policyFindingIds.map(id => (
                        <span
                          key={id}
                          className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-muted"
                        >
                          {id}
                        </span>
                      ))}
                    </span>
                  )}
                  <EvidenceLinks traceId={traceId} eventIds={intervention.evidenceEventIds} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-faint">
        <span>Gated at</span>
        <EvidenceLinks traceId={traceId} eventIds={[delivery.eventId]} />
      </div>
    </Panel>
  );
};
