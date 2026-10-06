import { DecisionBadge } from "@/components/ui/decision-badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { GateVerdict, ReviewEntry, ReviewTarget, Viewer } from "@/types";
import { ReviewForm } from "./review-form";
import { ReviewHistory } from "./review-history";

type ReviewSectionProps = {
  target: ReviewTarget;
  machineDecision: GateVerdict;
  history: ReviewEntry[];
  viewer: Viewer | null;
};

const roleText = { engineer: "Engineer", reviewer: "Reviewer", admin: "Admin" } as const;

/**
 * Human review is recorded beside the machine decision and never replaces it.
 * Showing or hiding the form only mirrors permissions; the backend enforces them.
 */
export const ReviewSection = ({
  target,
  machineDecision,
  history,
  viewer,
}: ReviewSectionProps) => (
  <Panel aria-labelledby="human-review">
    <PanelHeader
      headingId="human-review"
      title="Human review"
      subtitle="Append-only history. A review never overwrites the machine decision."
      action={
        <span className="flex items-center gap-2 text-xs text-faint">
          Machine decision
          <DecisionBadge decision={machineDecision} size="sm" />
        </span>
      }
    />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ink">
          Review history ({history.length})
        </h3>
        <ReviewHistory entries={history} />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-medium text-ink">Add a review</h3>
        {viewer?.permissions.canReview ? (
          <ReviewForm target={target} />
        ) : (
          <p className="text-sm text-muted">
            {viewer
              ? `Your role (${roleText[viewer.role]}) cannot submit reviews.`
              : "Sign-in details are unavailable, so reviews cannot be submitted."}{" "}
            The platform enforces this on the server.
          </p>
        )}
      </div>
    </div>
  </Panel>
);
