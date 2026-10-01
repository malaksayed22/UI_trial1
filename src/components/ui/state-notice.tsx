import {
  AlertCircle,
  CircleSlash,
  FileQuestion,
  Inbox,
  PlugZap,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StateKind =
  | "empty"
  | "not_found"
  | "not_applicable"
  | "unavailable"
  | "forbidden";

const kinds: Record<
  StateKind,
  { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; tone: string }
> = {
  empty: { icon: Inbox, tone: "text-faint" },
  not_found: { icon: FileQuestion, tone: "text-faint" },
  not_applicable: { icon: CircleSlash, tone: "text-faint" },
  unavailable: { icon: PlugZap, tone: "text-review" },
  forbidden: { icon: AlertCircle, tone: "text-block" },
};

type StateNoticeProps = {
  kind: StateKind;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** One consistent presentation for empty, missing, unavailable and denied states. */
export const StateNotice = ({
  kind,
  title,
  children,
  action,
  className,
}: StateNoticeProps) => {
  const { icon: Icon, tone } = kinds[kind];
  return (
    <div
      role={kind === "unavailable" || kind === "forbidden" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-dashed border-line-strong bg-surface p-6 sm:flex-row",
        className
      )}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-5 shrink-0", tone)} />
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
      {action}
    </div>
  );
};
