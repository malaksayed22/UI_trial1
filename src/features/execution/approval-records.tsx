import { CheckCircle2, CircleMinus, Hourglass, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag, type TagTone } from "@/components/ui/tag";
import { formatDateTime } from "@/lib/format";
import { approvalStatusText } from "@/lib/labels";
import type { ApprovalRecord, ApprovalStatus } from "@/types";

const statusView = {
  pending: { tone: "review", icon: Hourglass, meaning: "Requested, not yet decided" },
  approved: { tone: "pass", icon: CheckCircle2, meaning: "Approved by the named approver" },
  denied: { tone: "block", icon: XCircle, meaning: "Denied by the named approver" },
  cancelled: { tone: "neutral", icon: CircleMinus, meaning: "Withdrawn before a decision was used" },
} as const satisfies Record<ApprovalStatus, { tone: TagTone; icon: LucideIcon; meaning: string }>;

export const ApprovalStatusTag = ({ status }: { status: ApprovalStatus }) => {
  const { tone, icon, meaning } = statusView[status];
  return (
    <Tag tone={tone} icon={icon} title={meaning}>
      {approvalStatusText[status]}
    </Tag>
  );
};

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <dt className="text-xs text-faint">{label}</dt>
    <dd className="mt-0.5 text-sm text-muted">{children}</dd>
  </div>
);

const ApprovalCard = ({ approval }: { approval: ApprovalRecord }) => (
  <li
    id={`approval-${approval.approvalId}`}
    className="scroll-mt-24 rounded-xl border border-line p-4"
  >
    <div className="flex flex-wrap items-start justify-between gap-2">
      <p className="text-sm font-medium text-ink">{approval.requirement}</p>
      <ApprovalStatusTag status={approval.status} />
    </div>
    <p className="mt-1 font-mono text-xs text-faint">
      {approval.source.system} · {approval.source.recordId}
    </p>
    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
      <Fact label="Requested">
        <time dateTime={approval.requestedAt}>{formatDateTime(approval.requestedAt)}</time>
      </Fact>
      <Fact label={approval.status === "cancelled" ? "Cancelled" : "Decided"}>
        {approval.decidedAt ? (
          <time dateTime={approval.decidedAt}>{formatDateTime(approval.decidedAt)}</time>
        ) : (
          "No decision yet"
        )}
      </Fact>
      <Fact label={approval.status === "cancelled" ? "Cancelled by" : "Decided by"}>
        {approval.decidedBy ?? "No one yet"}
      </Fact>
      <Fact label="Gates">
        {approval.actionIds.length === 0 ? (
          "No action"
        ) : (
          <span className="inline-flex flex-wrap gap-1.5">
            {approval.actionIds.map(id => (
              <a
                key={id}
                href={`#action-${id}`}
                className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-xs text-info hover:border-info/60 hover:bg-info/10"
              >
                {id}
              </a>
            ))}
          </span>
        )}
      </Fact>
    </dl>
    {approval.note && (
      <p className="mt-3 border-l-2 border-line-strong pl-3 text-sm text-muted">
        {approval.note}
      </p>
    )}
  </li>
);

type ApprovalRecordsProps = { approvals: ApprovalRecord[] };

/**
 * Approval status is read from the approval system's records. It is never
 * taken from the model's response, which may say "approved" when it is not.
 */
export const ApprovalRecords = ({ approvals }: ApprovalRecordsProps) => (
  <Panel aria-labelledby="approvals-heading" className="h-fit">
    <PanelHeader
      headingId="approvals-heading"
      title="Approval records"
      subtitle="Status comes from the approval system, not from model-written text."
    />
    {approvals.length === 0 ? (
      <p className="text-sm text-block">
        No approval record exists for this trace. The action had nothing to authorize it.
      </p>
    ) : (
      <ul className="space-y-3">
        {approvals.map(approval => (
          <ApprovalCard key={approval.approvalId} approval={approval} />
        ))}
      </ul>
    )}
  </Panel>
);
