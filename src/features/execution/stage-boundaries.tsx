import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import type { ActionRecord, WorkflowPolicyStage } from "@/types";

type StageRowProps = { label: string; stage: WorkflowPolicyStage | null; absent: string };

const StageRow = ({ label, stage, absent }: StageRowProps) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2">
    <dt className="text-xs text-faint">{label}</dt>
    <dd>
      {stage ? (
        <Tag tone="neutral" className="font-mono">
          {stage}
        </Tag>
      ) : (
        <span className="text-xs text-muted">{absent}</span>
      )}
    </dd>
  </div>
);

type StageBoundariesProps = { actions: ActionRecord[] };

/**
 * TRD-23. The policy stage at proposal, at the policy check and at dispatch,
 * plus the current stage. A stage records where the workflow stood; it is not
 * a result, so every value is shown as a plain neutral label.
 */
export const StageBoundaries = ({ actions }: StageBoundariesProps) => {
  const staged = actions.filter(action => action.stageAtBoundaries);

  return (
    <Panel aria-labelledby="stage-boundaries-heading">
      <PanelHeader
        headingId="stage-boundaries-heading"
        title="Policy stage at each boundary"
        subtitle="Where the workflow stood when the action was proposed, checked and dispatched. A stage is not a pass or fail result."
      />
      {staged.length === 0 ? (
        <p className="text-sm text-muted">
          No stage data was recorded for the actions in this trace.
        </p>
      ) : (
        <ul className="space-y-3">
          {staged.map(action => {
            const stages = action.stageAtBoundaries;
            if (!stages) return null;
            return (
              <li key={action.actionId} className="rounded-xl border border-line p-4">
                <p className="mb-3 font-mono text-sm text-ink">
                  {action.tool} <span className="text-faint">· {action.actionId}</span>
                </p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <StageRow label="At proposal" stage={stages.policyStageAtProposal} absent="" />
                  <StageRow label="At policy check" stage={stages.checkedPolicyStage} absent="" />
                  <StageRow
                    label="At dispatch"
                    stage={stages.policyStageAtDispatch}
                    absent="Not dispatched"
                  />
                  <StageRow label="Current stage" stage={stages.policyStage} absent="" />
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};
