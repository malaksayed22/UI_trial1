import { Tag, type TagTone } from "@/components/ui/tag";
import { formatDateTime } from "@/lib/format";
import type { ReviewEntry, ReviewVerdict } from "@/types";

const verdictTone: Record<ReviewVerdict, TagTone> = {
  ACCEPT: "pass",
  REVIEW: "review",
  BLOCK: "block",
};

const roleText = { engineer: "Engineer", reviewer: "Reviewer", admin: "Admin" } as const;

type ReviewHistoryProps = { entries: ReviewEntry[] };

/** Append-only log, newest first. Entries are never edited or removed. */
export const ReviewHistory = ({ entries }: ReviewHistoryProps) => {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">No human reviews have been recorded yet.</p>;
  }
  return (
    <ol className="space-y-3">
      {entries.map(entry => (
        <li key={entry.reviewId} className="rounded-lg border border-line bg-canvas/40 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-ink">{entry.reviewer}</span>
            <span className="text-xs text-faint">{roleText[entry.role]}</span>
            <Tag tone={verdictTone[entry.verdict]}>{entry.verdict}</Tag>
            <time dateTime={entry.createdAt} className="ml-auto font-mono text-xs text-faint">
              {formatDateTime(entry.createdAt)}
            </time>
          </div>
          <p className="mt-2 text-sm text-muted">{entry.rationale}</p>
        </li>
      ))}
    </ol>
  );
};
