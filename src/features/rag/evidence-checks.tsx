import { CheckCircle2, XCircle } from "lucide-react";
import { MeasurementValue } from "@/components/ui/measurement-value";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import { ragFailureModeText } from "@/lib/labels";
import type { RagDiagnostics } from "@/types";

type ExpectedEvidenceProps = { items: RagDiagnostics["expectedEvidence"] };

export const ExpectedEvidencePanel = ({ items }: ExpectedEvidenceProps) => (
  <Panel aria-labelledby="expected-heading">
    <PanelHeader
      headingId="expected-heading"
      title="Expected evidence"
      subtitle="Scenario ground truth for this query"
    />
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item.documentRef} className="flex items-start gap-3">
          {item.retrieved ? (
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 text-pass" />
          ) : (
            <XCircle aria-hidden className="mt-0.5 size-4 text-block" />
          )}
          <div>
            <p className="font-mono text-sm text-ink">{item.documentRef}</p>
            <p className={item.retrieved ? "text-xs text-muted" : "text-xs text-block"}>
              {item.retrieved ? `Retrieved · rank #${item.rank}` : "Not retrieved"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  </Panel>
);

type CitationsProps = { citations: RagDiagnostics["citations"] };

export const CitationsPanel = ({ citations }: CitationsProps) => (
  <Panel aria-labelledby="citations-heading">
    <PanelHeader
      headingId="citations-heading"
      title="Citations"
      subtitle="Each answer claim mapped to its source document"
    />
    <ul className="divide-y divide-line">
      {citations.map(citation => (
        <li
          key={citation.claim}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
        >
          <span className="text-sm text-ink">“{citation.claim}”</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="font-mono text-xs text-muted">
              {citation.documentId ? `→ ${citation.documentId}` : "no source"}
            </span>
            <Tag
              tone={citation.status === "supported" ? "pass" : "review"}
              icon={citation.status === "supported" ? CheckCircle2 : XCircle}
            >
              {citation.status === "supported" ? "Supported" : "Unsupported"}
            </Tag>
          </span>
        </li>
      ))}
    </ul>
  </Panel>
);

type MetricsProps = { diagnostics: RagDiagnostics };

const metricRows = (metrics: RagDiagnostics["metrics"], k: number) =>
  [
    ["Groundedness", metrics.groundedness],
    ["Citation support", metrics.citationSupport],
    [`Recall@${k}`, metrics.recallAtK],
    ["Mean reciprocal rank", metrics.meanReciprocalRank],
  ] as const;

/** Metrics keep their own names and direction; no composite score is invented. */
export const MetricsPanel = ({ diagnostics }: MetricsProps) => (
  <Panel aria-labelledby="metrics-heading">
    <PanelHeader
      headingId="metrics-heading"
      title="Groundedness and retrieval metrics"
      subtitle={`Evaluator ${diagnostics.evaluatorVersion}`}
    />
    <dl className="grid gap-4 sm:grid-cols-2">
      {metricRows(diagnostics.metrics, diagnostics.k).map(([name, measurement]) => (
        <div key={name}>
          <dt className="text-xs text-faint">{name}</dt>
          <dd className="mt-1 text-xl">
            <MeasurementValue measurement={measurement} showDirection />
          </dd>
        </div>
      ))}
    </dl>
  </Panel>
);

type FailureModeProps = { diagnostics: RagDiagnostics };

/** Separates retrieval failure, weak context and unsupported generation. */
export const FailureModePanel = ({ diagnostics }: FailureModeProps) => {
  const mode = ragFailureModeText[diagnostics.failureMode];
  return (
    <Panel aria-labelledby="failure-mode-heading">
      <PanelHeader
        headingId="failure-mode-heading"
        title="Where did it go wrong?"
        subtitle="Classification of the RAG failure mode"
      />
      <p className="text-base font-medium text-ink">{mode.title}</p>
      <p className="mt-1 text-sm text-muted">{mode.description}</p>
      {diagnostics.unsupportedClaims.length > 0 && (
        <div
          role="note"
          className="mt-4 rounded-lg border border-review/40 bg-review/10 p-3 text-sm"
        >
          <p className="font-medium text-review">Unsupported claims</p>
          <ul className="mt-1.5 space-y-1.5 text-muted">
            {diagnostics.unsupportedClaims.map(item => (
              <li key={item.claim}>
                “{item.claim}” <span className="text-faint">— {item.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
};
