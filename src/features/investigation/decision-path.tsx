import { ArrowRight, Gavel, Scale } from "lucide-react";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { EvidenceLinks } from "@/components/ui/evidence-link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { DecisionStep } from "@/types";

type DecisionPathProps = { traceId: string; steps: DecisionStep[] };

const StepIcon = ({ step }: { step: DecisionStep }) => {
  switch (step.kind) {
    case "observation":
      return <ArrowRight aria-hidden className="size-4 text-info" />;
    case "rule":
      return <Gavel aria-hidden className="size-4 text-model" />;
    case "precedence":
      return <Scale aria-hidden className="size-4 text-review" />;
    case "verdict":
      return null;
  }
};

const stepLabel: Record<DecisionStep["kind"], string> = {
  observation: "Observed",
  rule: "Rule",
  precedence: "Precedence",
  verdict: "Verdict",
};

/** Why the final decision won, step by step; classification is not the decision. */
export const DecisionPath = ({ traceId, steps }: DecisionPathProps) => (
  <Panel aria-labelledby="decision-path-heading">
    <PanelHeader
      headingId="decision-path-heading"
      title="Decision path"
      subtitle="How the contributing findings resolved to the final verdict"
    />
    <ol className="space-y-3">
      {steps.map((step, index) =>
        step.kind === "verdict" ? (
          <li key={index} className="flex items-center gap-3 border-t border-line pt-3">
            <span className="text-sm text-muted">{step.text}</span>
            <DecisionBadge decision={step.decision} size="sm" />
          </li>
        ) : (
          <li key={index} className="flex gap-3">
            <span className="mt-0.5">
              <StepIcon step={step} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-faint">{stepLabel[step.kind]}</p>
              <p className="text-sm text-muted">
                {step.text}
                {step.kind === "rule" && (
                  <span className="ml-1.5 font-mono text-xs text-info">{step.policyId}</span>
                )}
              </p>
              {step.kind === "observation" && step.evidenceEventId && (
                <div className="mt-1">
                  <EvidenceLinks traceId={traceId} eventIds={[step.evidenceEventId]} />
                </div>
              )}
            </div>
          </li>
        )
      )}
    </ol>
  </Panel>
);
