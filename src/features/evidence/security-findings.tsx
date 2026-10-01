import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag, type TagTone } from "@/components/ui/tag";
import type { SecurityFinding } from "@/types";

const detectorTone: Record<SecurityFinding["detectorOutcome"], TagTone> = {
  detected: "pass",
  missed: "block",
  not_evaluated: "neutral",
};

const detectorText: Record<SecurityFinding["detectorOutcome"], string> = {
  detected: "Detected",
  missed: "Missed",
  not_evaluated: "Not evaluated",
};

const protectionText = (held: boolean | null) =>
  held === null ? "Not evaluated" : held ? "Held" : "Did not hold";

type SecurityFindingsProps = {
  traceId: string;
  findings: SecurityFinding[];
  headingId?: string;
};

/**
 * Detector outcome, observed action and policy protection are separate facts:
 * a missed semantic detection never implies the action was authorised.
 */
export const SecurityFindings = ({
  traceId,
  findings,
  headingId = "security-findings",
}: SecurityFindingsProps) => (
  <Panel aria-labelledby={headingId}>
    <PanelHeader
      headingId={headingId}
      title="Security evidence"
      subtitle="Detector outcome, observed action and policy protection are reported separately."
    />
    {findings.length === 0 ? (
      <p className="text-sm text-muted">
        No attack pattern was recorded for this trace.
      </p>
    ) : (
      <ul className="space-y-3">
        {findings.map(finding => (
          <li
            key={finding.attackCategory}
            className="rounded-lg border border-line bg-canvas/40 p-3"
          >
            <p className="text-sm font-medium text-ink">
              {finding.attackCategory}
            </p>
            <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-faint">Detector</dt>
                <dd className="mt-1">
                  <Tag tone={detectorTone[finding.detectorOutcome]}>
                    {detectorText[finding.detectorOutcome]}
                  </Tag>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Observed unsafe action</dt>
                <dd className="mt-1 text-muted">
                  {finding.observedUnsafeAction ?? "None observed"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Policy protection</dt>
                <dd className="mt-1 text-muted">
                  {protectionText(finding.policyProtectionHeld)}
                </dd>
              </div>
            </dl>
            <div className="mt-2">
              <EvidenceLinks
                traceId={traceId}
                eventIds={finding.evidenceEventIds}
              />
            </div>
          </li>
        ))}
      </ul>
    )}
  </Panel>
);
