import {
  CheckCircle2,
  CircleHelp,
  CirclePause,
  CircleSlash,
  GitCommitHorizontal,
  Hourglass,
  ShieldCheck,
  ShieldX,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag, type TagTone } from "@/components/ui/tag";
import { executionStatusText, policyStageText } from "@/lib/labels";
import type {
  Decision,
  ExecutionStatus,
  PolicyGateDetail,
  PolicyStage,
  TraceStatus,
} from "@/types";

type TagView = { tone: TagTone; icon: LucideIcon };

const policyView = {
  not_applicable: { tone: "neutral", icon: CircleSlash },
  not_evaluated: { tone: "neutral", icon: Hourglass },
  gate_passed: { tone: "pass", icon: ShieldCheck },
  gate_blocked: { tone: "block", icon: ShieldX },
} as const satisfies Record<PolicyStage, TagView>;

const executionView = {
  not_applicable: { tone: "neutral", icon: CircleSlash },
  not_executed: { tone: "neutral", icon: CirclePause },
  executed: { tone: "pass", icon: CheckCircle2 },
  failed: { tone: "block", icon: XCircle },
  outcome_unknown: { tone: "review", icon: CircleHelp },
} as const satisfies Record<ExecutionStatus, TagView>;

type SignalProps = {
  label: string;
  source: string;
  note?: string;
  children: ReactNode;
};

const Signal = ({ label, source, note, children }: SignalProps) => (
  <div className="rounded-lg border border-line bg-canvas/40 p-3">
    <dt className="text-xs text-faint">{label}</dt>
    <dd className="mt-2">{children}</dd>
    {note && <dd className="mt-2 text-xs leading-5 text-muted">{note}</dd>}
    <dd className="mt-2 font-mono text-[11px] uppercase tracking-wider text-faint">
      {source}
    </dd>
  </div>
);

/**
 * The policy engine's own report, shown as given: the action verdict, the
 * basis code for it, and the result of each policy it evaluated. The
 * explanation is a separate sentence for people and is labelled as such, so it
 * is not mistaken for the contract code.
 */
const PolicyGateDetailView = ({ gate }: { gate: PolicyGateDetail }) => (
  <dl className="mt-3 space-y-2 border-t border-line pt-3 text-xs">
    <div>
      <dt className="text-faint">Action verdict</dt>
      <dd className="mt-0.5 font-mono text-ink">{gate.actionVerdict}</dd>
    </div>
    <div>
      <dt className="text-faint">Verdict basis code</dt>
      <dd className="mt-0.5 break-all font-mono text-ink">{gate.verdictBasis}</dd>
    </div>
    <div>
      <dt className="text-faint">Verdict explanation</dt>
      <dd className="mt-0.5 leading-5 text-muted">{gate.verdictExplanation}</dd>
    </div>
    <div>
      <dt className="text-faint">Evaluated policies</dt>
      <dd>
        <ul className="mt-1 space-y-1">
          {gate.evaluatedPolicies.map(policy => (
            <li key={policy.policyId} className="flex justify-between gap-2 font-mono">
              <span className="text-muted">{policy.policyId}</span>
              <span className="text-ink">{policy.policyResult}</span>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  </dl>
);

type TraceStatusPanelProps = { status: TraceStatus; decision: Decision };

/**
 * Four independent signals about one trace. Execution can be "not executed"
 * while the decision is PASS, and a passed policy gate can sit beside an
 * unknown outcome. Each is shown on its own and none is derived from another.
 */
export const TraceStatusPanel = ({ status, decision }: TraceStatusPanelProps) => {
  const policy = policyView[status.policy.stage];
  const execution = executionView[status.execution.status];

  return (
    <Panel aria-labelledby="trace-status-heading">
      <PanelHeader
        headingId="trace-status-heading"
        title="Trace status"
        subtitle="Four separate signals. Each is reported by its own system and none is derived from another."
      />
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Signal label="Workflow state" source="Application" note={status.workflow.note}>
          <Tag tone="neutral" icon={GitCommitHorizontal} className="font-mono">
            {status.workflow.state}
          </Tag>
        </Signal>
        <Signal label="Policy gate" source="Policy engine" note={status.policy.note}>
          <Tag tone={policy.tone} icon={policy.icon}>
            {policyStageText[status.policy.stage]}
          </Tag>
          {status.policy.gate && <PolicyGateDetailView gate={status.policy.gate} />}
        </Signal>
        <Signal label="Execution" source="Tool gateway" note={status.execution.note}>
          <Tag tone={execution.tone} icon={execution.icon}>
            {executionStatusText[status.execution.status]}
          </Tag>
        </Signal>
        <Signal
          label="Reliability decision"
          source="Decision engine"
          note="PASS, REVIEW or BLOCK for the whole trace. It does not describe execution."
        >
          <DecisionBadge decision={decision} />
        </Signal>
      </dl>
    </Panel>
  );
};
