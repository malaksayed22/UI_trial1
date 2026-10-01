import { MeasurementValue } from "@/components/ui/measurement-value";
import { Panel } from "@/components/ui/panel";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { classifierText, describeFailureLabel } from "@/lib/labels";
import type { Investigation } from "@/types";

type PrimaryFailureProps = { investigation: Investigation };

/**
 * Classification, cause ranking and decision logic are separate steps. This
 * panel shows the classification and the run that produced it.
 */
export const PrimaryFailure = ({ investigation }: PrimaryFailureProps) => {
  const { primaryLabel, classifier, provenance, decision, traceId, applicationName } =
    investigation;
  const isNormal = primaryLabel === "NORMAL";

  return (
    <Panel aria-labelledby="primary-failure-heading">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-faint">
            {traceId} · {applicationName}
          </p>
          <h2 id="primary-failure-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            {isNormal ? "Normal execution" : describeFailureLabel(primaryLabel)}
          </h2>
          <p className="mt-1 text-sm text-muted">Primary failure label</p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3 md:text-right">
          <div>
            <dt className="text-xs text-faint">
              Classifier · {classifierText[classifier.kind]}
            </dt>
            <dd className="mt-1 text-2xl">
              <MeasurementValue measurement={classifier.score} />
            </dd>
            <dd className="mt-0.5 text-xs text-faint">
              model score, not a calibrated probability
            </dd>
          </div>
          <div>
            <dt className="text-xs text-faint">Classifier version</dt>
            <dd className="mt-1 font-mono text-sm text-ink">{classifier.version}</dd>
          </div>
          <div className="sm:text-right">
            <dt className="text-xs text-faint">Machine decision</dt>
            <dd className="mt-1">
              <DecisionBadge decision={decision} />
            </dd>
          </div>
        </dl>
      </div>

      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4 font-mono text-xs">
        <div className="flex gap-2">
          <dt className="text-faint">Run</dt>
          <dd className="text-muted">{provenance.runId}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-faint">Evaluator set</dt>
          <dd className="text-muted">{provenance.evaluatorSetVersion}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-faint">Dataset</dt>
          <dd className="text-muted">{provenance.datasetVersion ?? "Live trace (no dataset)"}</dd>
        </div>
      </dl>
    </Panel>
  );
};
