import { ArrowRight } from "lucide-react";
import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import type { StateTransition } from "@/types";

const dispositionView = {
  accepted: {
    label: "Accepted",
    meaning: "The application accepted this transition.",
  },
  attempted: {
    label: "Attempted",
    meaning: "The transition was attempted. The record does not show it as accepted.",
  },
} as const satisfies Record<StateTransition["disposition"], { label: string; meaning: string }>;

const TransitionRow = ({ traceId, transition }: { traceId: string; transition: StateTransition }) => {
  const disposition = dispositionView[transition.disposition];
  return (
    <li className="rounded-lg border border-line bg-canvas/40 p-3">
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-ink">
        <span>{transition.previousState}</span>
        <ArrowRight aria-hidden className="size-3.5 text-faint" />
        <span>{transition.newState}</span>
      </div>
      <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <dt className="text-faint">Policy stage</dt>
          <dd>
            <Tag tone="neutral" className="font-mono">
              {transition.policyStage}
            </Tag>
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-faint">Transition</dt>
          <dd>
            <Tag tone="neutral" title={disposition.meaning}>
              {disposition.label}
            </Tag>
          </dd>
        </div>
      </dl>
      <div className="mt-2">
        <EvidenceLinks traceId={traceId} eventIds={[transition.eventId]} />
      </div>
    </li>
  );
};

type StateTransitionsProps = { traceId: string; transitions: StateTransition[] };

/**
 * TRD-22. Previous and new application state, the coarse policy stage they
 * belong to, and whether the transition was accepted or only attempted. A
 * stage is a position in the workflow, so it carries no pass/fail styling.
 */
export const StateTransitions = ({ traceId, transitions }: StateTransitionsProps) => (
  <Panel aria-labelledby="transitions-heading">
    <PanelHeader
      headingId="transitions-heading"
      title="State transitions"
      subtitle="Previous and new application state, with the policy stage each belongs to."
    />
    {transitions.length === 0 ? (
      <p className="text-sm text-muted">No state transition was recorded for this trace.</p>
    ) : (
      <ol className="space-y-2">
        {transitions.map(transition => (
          <TransitionRow
            key={transition.eventId + transition.newState}
            traceId={traceId}
            transition={transition}
          />
        ))}
      </ol>
    )}
  </Panel>
);
