import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type StatCardProps = {
  label: string;
  value: string;
  note: ReactNode;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tone?: "info" | "pass" | "review" | "block";
};

const iconTones = {
  info: "border-info/30 bg-info/10 text-info",
  pass: "border-pass/30 bg-pass/10 text-pass",
  review: "border-review/30 bg-review/10 text-review",
  block: "border-block/30 bg-block/10 text-block",
} as const;

export const StatCard = ({
  label,
  value,
  note,
  icon: Icon,
  tone = "info",
}: StatCardProps) => (
  <div className="rounded-2xl border border-line bg-surface p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-lg border",
        iconTones[tone]
      )}
    >
      <Icon aria-hidden className="size-4" />
    </div>
    <p className="mt-4 text-4xl font-medium tracking-[-0.04em] tabular-nums">
      {value}
    </p>
    <p className="mt-1 text-sm text-muted">{label}</p>
    <p className="mt-3 border-t border-line pt-2 font-mono text-xs text-faint">
      {note}
    </p>
  </div>
);
