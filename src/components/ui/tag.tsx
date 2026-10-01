import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TagTone = "pass" | "review" | "block" | "info" | "model" | "neutral";

const toneClasses: Record<TagTone, string> = {
  pass: "border-pass/40 bg-pass/10 text-pass",
  review: "border-review/40 bg-review/10 text-review",
  block: "border-block/40 bg-block/10 text-block",
  info: "border-info/40 bg-info/10 text-info",
  model: "border-model/40 bg-model/10 text-model",
  neutral: "border-line-strong bg-raised text-muted",
};

type TagProps = {
  tone?: TagTone;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: ReactNode;
  className?: string;
};

/** Compact labelled status. Pair the tone with an icon or explicit text. */
export const Tag = ({
  tone = "neutral",
  icon: Icon,
  children,
  className,
}: TagProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
      toneClasses[tone],
      className
    )}
  >
    {Icon && <Icon aria-hidden className="size-3.5" />}
    {children}
  </span>
);
