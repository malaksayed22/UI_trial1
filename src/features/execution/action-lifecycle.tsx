import { Ban, CheckCircle2, CircleHelp, Diamond, ShieldCheck, ShieldX, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import type {
  ActionAuthorization,
  ActionInvocation,
  ActionRecord,
  ApprovalRecord,
} from "@/types";
import { SideEffectView } from "./side-effect";

const AuthorizationTag = ({ status }: { status: ActionAuthorization["status"] }) =>
  status === "authorized" ? (
    <Tag tone="pass" icon={ShieldCheck}>Authorized</Tag>
  ) : (
    <Tag tone="block" icon={ShieldX}>Not authorized</Tag>
  );

const InvocationTag = ({ invocation }: { invocation: ActionInvocation }) => {
  if (invocation.status === "suppressed") {
    return (
      <Tag tone="block" icon={Ban} title="The call was never dispatched to the tool">
        Suppressed · not executed
      </Tag>
    );
  }
  switch (invocation.result) {
    case "succeeded":
      return <Tag tone="pass" icon={CheckCircle2}>Invoked · succeeded</Tag>;
    case "failed":
      return <Tag tone="block" icon={XCircle}>Invoked · failed</Tag>;
    case "unconfirmed":
      return (
        <Tag tone="review" icon={CircleHelp} title="Dispatched, but no confirmation came back">
          Invoked · unconfirmed
        </Tag>
      );
  }
};

const invocationText = (invocation: ActionInvocation) => {
  if (invocation.status === "suppressed") return invocation.reason;
  switch (invocation.result) {
    case "succeeded":
      return "The tool gateway dispatched the call and received a confirmed result.";
    case "failed":
      return "The tool gateway dispatched the call and the tool reported a failure.";
    case "unconfirmed":
      return "The tool gateway dispatched the call but received no confirmation.";
  }
};

type StepProps = { index: number; label: string; children: ReactNode };

const Step = ({ index, label, children }: StepProps) => (
  <li className="rounded-lg border border-line bg-canvas/40 p-3">
    <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
      {index} · {label}
    </p>
    <div className="mt-2 space-y-2">{children}</div>
  </li>
);

const IdChip = ({ href, children }: { href?: string; children: ReactNode }) => {
  const classes = "rounded border border-line-strong px-1.5 py-0.5 font-mono text-xs";
  return href ? (
    <a href={href} className={`${classes} text-info hover:border-info/60 hover:bg-info/10`}>
      {children}
    </a>
  ) : (
    <span className={`${classes} text-muted`}>{children}</span>
  );
};

/**
 * PROVISIONAL (pending Mohab's SA-03 schema mechanism). Shows the approval
 * record and version the action used. When that record is cancelled, the
 * cancellation is reported through this reference only. The matching rule
 * (by approval id) is a placeholder, not a final mapping.
 */
const ApprovalRecordRefs = ({
  authorization,
  approvals,
}: {
  authorization: ActionAuthorization;
  approvals: ApprovalRecord[];
}) => {
  const refs = authorization.approvalRecordRefs;
  if (!refs || refs.length === 0) return null;
  return (
    <ul className="space-y-1 text-xs" aria-label="Approval record used (provisional)">
      {refs.map(ref => {
        const record = approvals.find(approval => approval.approvalId === ref.approvalId);
        return (
          <li key={`${ref.approvalId}@${ref.recordVersion}`} className="text-muted">
            Used record <span className="font-mono text-ink">{ref.approvalId}</span> version{" "}
            <span className="font-mono text-ink">{ref.recordVersion}</span>
            {record?.status === "cancelled" && (
              <span> · that record was cancelled</span>
            )}
            <span className="ml-1.5 rounded border border-line-strong px-1 py-0.5 text-[10px] uppercase tracking-wider text-faint">
              Provisional link
            </span>
          </li>
        );
      })}
    </ul>
  );
};

type ActionCardProps = { traceId: string; action: ActionRecord; approvals: ApprovalRecord[] };

const ActionCard = ({ traceId, action, approvals }: ActionCardProps) => {
  const { authorization, invocation } = action;
  const args = Object.entries(action.arguments);
  return (
    <li
      id={`action-${action.actionId}`}
      className="scroll-mt-24 rounded-xl border border-line p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-mono text-sm text-ink">{action.tool}</h3>
        <IdChip>{action.actionId}</IdChip>
      </div>
      <ol className="mt-3 grid gap-3 md:grid-cols-2">
        <Step index={1} label="Proposal">
          <Tag tone="review" icon={Diamond} title="The agent asked for this action. Nothing has run yet">
            Proposed
          </Tag>
          <dl className="space-y-0.5 font-mono text-xs text-muted">
            {args.map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <dt className="text-faint">{key}</dt>
                <dd className="break-all">{value}</dd>
              </div>
            ))}
          </dl>
          <EvidenceLinks traceId={traceId} eventIds={[action.proposal.eventId]} />
        </Step>

        <Step index={2} label="Authorization">
          <AuthorizationTag status={authorization.status} />
          <p className="text-sm text-muted">{authorization.detail}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {authorization.approvalIds.length === 0 ? (
              <span className="text-faint">No approval record linked</span>
            ) : (
              <>
                <span className="text-faint">Approval</span>
                {authorization.approvalIds.map(id => (
                  <IdChip key={id} href={`#approval-${id}`}>{id}</IdChip>
                ))}
              </>
            )}
          </div>
          <ApprovalRecordRefs authorization={authorization} approvals={approvals} />
          {authorization.policyFindingIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-faint">Policy</span>
              {authorization.policyFindingIds.map(id => (
                <IdChip key={id}>{id}</IdChip>
              ))}
            </div>
          )}
        </Step>

        <Step index={3} label="Invocation">
          <InvocationTag invocation={invocation} />
          <p className="text-sm text-muted">{invocationText(invocation)}</p>
          {invocation.eventId && (
            <EvidenceLinks traceId={traceId} eventIds={[invocation.eventId]} />
          )}
        </Step>

        <Step index={4} label="Side effect">
          <SideEffectView traceId={traceId} effect={action.effect} />
        </Step>
      </ol>
    </li>
  );
};

type ActionLifecycleProps = {
  traceId: string;
  actions: ActionRecord[];
  /** Used only to resolve provisional approval record references. */
  approvals?: ApprovalRecord[];
};

/**
 * One card per action. Proposal, authorization, invocation and side effect are
 * four separate facts: a proposed action is not authorised, an authorised
 * action may never run, and a run action may have an unknown effect.
 */
export const ActionLifecycle = ({ traceId, actions, approvals = [] }: ActionLifecycleProps) => (
  <Panel aria-labelledby="actions-heading">
    <PanelHeader
      headingId="actions-heading"
      title="Action lifecycle"
      subtitle="Proposal, authorization, invocation and side effect are recorded separately."
    />
    <ul className="space-y-3">
      {actions.map(action => (
        <ActionCard key={action.actionId} traceId={traceId} action={action} approvals={approvals} />
      ))}
    </ul>
  </Panel>
);
