import { DecisionBadge } from "@/components/ui/decision-badge";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { formatDateTime, formatInteger } from "@/lib/format";
import type { GateRun } from "@/types";
import { effectiveVerdict, verdictExplanation } from "./verdict";

const border = {
  PASS: "border-pass/40",
  REVIEW: "border-review/40",
  BLOCK: "border-block/50",
  INCOMPLETE: "border-line-strong",
} as const;

type GateVerdictPanelProps = { run: GateRun };

export const GateVerdictPanel = ({ run }: GateVerdictPanelProps) => {
  const verdict = effectiveVerdict(run);
  return (
    <Panel aria-labelledby="verdict-heading" className={cn("border-2", border[verdict])}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 id="verdict-heading" className="font-mono text-xs uppercase tracking-wider text-faint">
            Release decision
          </h2>
          <div className="mt-3">
            <DecisionBadge decision={verdict} size="lg" />
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted">{verdictExplanation(verdict)}</p>
        </div>
        <dl className="grid gap-1 font-mono text-xs md:text-right">
          <div>
            <dt className="inline text-faint">Run </dt>
            <dd className="inline text-muted">{run.runId}</dd>
          </div>
          <div>
            <dt className="inline text-faint">Started </dt>
            <dd className="inline text-muted">
              <time dateTime={run.startedAt}>{formatDateTime(run.startedAt)}</time>
            </dd>
          </div>
          <div>
            <dt className="inline text-faint">Status </dt>
            <dd className="inline text-muted">{run.status}</dd>
          </div>
          <div>
            <dt className="inline text-faint">Dataset </dt>
            <dd className="inline text-muted">
              {run.datasetVersion} · {formatInteger(run.traceCount)} traces
            </dd>
          </div>
          <div>
            <dt className="inline text-faint">Evaluators </dt>
            <dd className="inline text-muted">{run.evaluatorSetVersion}</dd>
          </div>
          <div>
            <dt className="inline text-faint">Artifact </dt>
            <dd className="inline break-all text-muted">{run.artifactPath}</dd>
          </div>
        </dl>
      </div>

      {run.reasons.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="mb-2 text-sm font-medium">Why this verdict</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted marker:text-faint">
            {run.reasons.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
};
