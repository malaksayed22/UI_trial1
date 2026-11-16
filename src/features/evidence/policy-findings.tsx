import { CheckCircle2, XCircle } from "lucide-react";
import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag, type TagTone } from "@/components/ui/tag";
import { criticalityText } from "@/lib/labels";
import type { Criticality, PolicyFinding, SupplierRecord } from "@/types";

const criticalityTone: Record<Criticality, TagTone> = {
  critical: "block",
  high: "review",
  medium: "info",
  low: "neutral",
};

type SupplierRecordEvidenceProps = {
  reference: NonNullable<PolicyFinding["supplierRecordRef"]>;
  records: SupplierRecord[];
};

/** The supplier record, and version, a finding relied on, with the status it holds. */
const SupplierRecordEvidence = ({ reference, records }: SupplierRecordEvidenceProps) => {
  const record = records.find(
    item =>
      item.supplierId === reference.supplierId && item.recordVersion === reference.recordVersion
  );
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      <span>Supplier record</span>
      <span className="font-mono text-ink">{reference.supplierId}</span>
      <span>version</span>
      <span className="font-mono text-ink">{reference.recordVersion}</span>
      {record ? (
        <Tag tone="neutral" className="font-mono">
          {record.status}
        </Tag>
      ) : (
        <span>(record not included in this view)</span>
      )}
    </p>
  );
};

type PolicyFindingsProps = {
  traceId: string;
  findings: PolicyFinding[];
  /** Records the findings may cite. Omit where they are not loaded. */
  supplierRecords?: SupplierRecord[];
  title?: string;
  subtitle?: string;
  headingId?: string;
};

export const PolicyFindings = ({
  traceId,
  findings,
  supplierRecords = [],
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
              {finding.supplierRecordRef && (
                <SupplierRecordEvidence
                  reference={finding.supplierRecordRef}
                  records={supplierRecords}
                />
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
