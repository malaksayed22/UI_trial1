import { FlaskConical } from "lucide-react";
import type { SyntheticBoundaryNote } from "@/types";

type ScenarioNoteProps = { note: SyntheticBoundaryNote };

/**
 * Says plainly that a fixture forces a path the normal application would not
 * take, so it is not read as evidence of what the application or Agent does.
 */
export const ScenarioNote = ({ note }: ScenarioNoteProps) => (
  <div
    role="note"
    className="flex items-start gap-3 rounded-xl border border-line-strong bg-canvas/40 p-4 text-sm"
  >
    <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-faint">
        Synthetic boundary case
      </p>
      <p className="mt-1 leading-6 text-muted">{note.text}</p>
    </div>
  </div>
);
