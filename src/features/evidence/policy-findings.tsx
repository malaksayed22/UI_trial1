import { CheckCircle2, XCircle } from "lucide-react";
import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag, type TagTone } from "@/components/ui/tag";
import { criticalityText } from "@/lib/labels";
import type { Criticality, PolicyFinding, TraceEvent } from "@/types";

const criticalityTone: Record<Criticality, TagTone> = {
  critical: "block",
  high: "review",
  medium: "info",
  low: "neutral",
};

type SupplierRecordEvidenceProps = {
  reference: NonNullable<PolicyFinding["supplierRecordRef"]>;
  /** The trace's events. Omit where they are not loaded. */
  events?: TraceEvent[];
};

/** The policy that checks the matching supplier record. */
const SUPPLIER_POLICY_ID = "PROC-SUPPLIER-01";

const evidenceLine = "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted";

const ApplicationLocalBadge = () => (
  <span
    className="rounded border border-line-strong px-1 py-0.5 text-[10px] uppercase tracking-wider text-faint"
    title="These supplier fields are the application's own, pending Mohab's canonical mapping."
  >
    Application-local · pending Mohab&apos;s mapping
  </span>
);

/**
 * The supplier record a finding relied on. The record is read from the supplier
 * directory snapshot event the finding cites. A proposal event, a missing event,
 * an unknown status and a failed lookup each get their own wording, and none of
 * them is ever shown as NOT_APPROVED.
 */
const SupplierRecordEvidence = ({ reference, events }: SupplierRecordEvidenceProps) => {
  const event = events?.find(item => item.eventId === reference.eventId);

  if (!events) {
    return (
      <p className={evidenceLine}>
        Cites supplier directory event <span className="font-mono text-ink">{reference.eventId}</span>
        . Open Trace Detail to see the record.
      </p>
    );
  }
  if (!event) {
    return (
      <p className={evidenceLine}>
        No supplier evidence recorded: event{" "}
        <span className="font-mono text-ink">{reference.eventId}</span> is not in this trace.
      </p>
    );
  }
  if (event.type !== "supplier_directory_snapshot") {
    return (
      <p className={evidenceLine}>
        Event <span className="font-mono text-ink">{reference.eventId}</span> is not a supplier
        directory snapshot, so it cannot show the supplier status.
      </p>
    );
  }

  const { lookup } = event;
  if (lookup.kind === "status_unknown") {
    return (
      <p className={evidenceLine}>
        <span>Supplier status unknown for</span>
        <span className="font-mono text-ink">{lookup.supplierId}</span>
        <span>({lookup.reason})</span>
        <ApplicationLocalBadge />
      </p>
    );
  }
  if (lookup.kind === "lookup_failed") {
    return (
      <p className={evidenceLine}>
        <span>Supplier directory lookup failed for</span>
        <span className="font-mono text-ink">{lookup.supplierId}</span>
        <span>({lookup.reason})</span>
        <ApplicationLocalBadge />
      </p>
    );
  }

  const { record } = lookup;
  const matches =
    record.supplierId === reference.supplierId && record.recordVersion === reference.recordVersion;
  if (!matches) {
    return (
      <p className={evidenceLine}>
        Record mismatch: the finding cites{" "}
        <span className="font-mono text-ink">
          {reference.supplierId} {reference.recordVersion}
        </span>{" "}
        but event <span className="font-mono text-ink">{reference.eventId}</span> holds{" "}
        <span className="font-mono text-ink">
          {record.supplierId} {record.recordVersion}
        </span>
        .
      </p>
    );
  }
  return (
    <p className={evidenceLine}>
      <span>Supplier record</span>
      <span className="font-mono text-ink">{record.supplierId}</span>
      <span>version</span>
      <span className="font-mono text-ink">{record.recordVersion}</span>
      <Tag tone="neutral">Synthetic version</Tag>
      <Tag tone="neutral" className="font-mono">
        {record.status}
      </Tag>
      <span>from {record.source}</span>
      <ApplicationLocalBadge />
    </p>
  );
};

type PolicyFindingsProps = {
  traceId: string;
  findings: PolicyFinding[];
  /** The trace's events, so a supplier finding can show the record it cites. */
  events?: TraceEvent[];
  title?: string;
  subtitle?: string;
  headingId?: string;
};

export const PolicyFindings = ({
  traceId,
  findings,
  events,
  title = "Policy findings",
  subtitle = "Deterministic procurement policy checks",
  headingId = "policy-findings",
}: PolicyFindingsProps) => (
  <Panel aria-labelledby={headingId}>
    <PanelHeader headingId={headingId} title={title} subtitle={subtitle} />
    {findings.length === 0 ? (
      <p className="text-sm text-muted">
        No procurement policies apply to this trace.
      </p>
    ) : (
      <ul className="space-y-3">
        {findings.map(finding => {
          const failed = finding.outcome === "fail";
          return (
            <li
              key={finding.policyId}
              className="rounded-lg border border-line bg-canvas/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-info">
                  {finding.policyId}
                </span>
                <Tag
                  tone={failed ? "block" : "pass"}
                  icon={failed ? XCircle : CheckCircle2}
                >
                  {failed ? "Failed" : "Passed"}
                </Tag>
                <Tag tone={criticalityTone[finding.criticality]}>
                  {criticalityText[finding.criticality]}
                </Tag>
                <span className="font-mono text-xs text-faint">
                  {finding.policyVersion}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs text-ink">{finding.rule}</p>
              <p className="mt-1 text-sm text-muted">{finding.description}</p>
              {finding.supplierRecordRef ? (
                <SupplierRecordEvidence reference={finding.supplierRecordRef} events={events} />
              ) : (
                finding.policyId === SUPPLIER_POLICY_ID && (
                  <p className={evidenceLine}>No supplier evidence recorded for this finding.</p>
                )
              )}
              <div className="mt-2">
                <EvidenceLinks
                  traceId={traceId}
                  eventIds={finding.evidenceEventIds}
                />
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </Panel>
);
