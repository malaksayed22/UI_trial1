import { AlertTriangle, Ban, CheckCircle2, CircleDashed } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/cn";
import type { GateVerdict } from "@/types";

type Tone = {
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  classes: string;
  meaning: string;
};

const tones: Record<GateVerdict, Tone> = {
  PASS: {
    label: "PASS",
    icon: CheckCircle2,
    classes: "border-pass/40 bg-pass/10 text-pass",
    meaning: "No critical failure; metrics within tolerance",
  },
  REVIEW: {
    label: "REVIEW",
    icon: AlertTriangle,
    classes: "border-review/40 bg-review/10 text-review",
    meaning: "Needs a human decision; not an approval",
  },
  BLOCK: {
    label: "BLOCK",
    icon: Ban,
    classes: "border-block/40 bg-block/10 text-block",
    meaning: "Critical failure or severe regression",
  },
  INCOMPLETE: {
    label: "INCOMPLETE",
    icon: CircleDashed,
    classes: "border-line-strong bg-raised text-muted",
    meaning: "Evaluation did not finish; never treated as PASS",
  },
};

type DecisionBadgeProps = {
  decision: GateVerdict;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "gap-1 px-2 py-0.5 text-xs",
  md: "gap-1.5 px-2.5 py-1 text-xs",
  lg: "gap-2 px-4 py-2 text-lg",
} as const;

/** Decision state shown as icon + text + colour, never colour alone. */
export const DecisionBadge = ({
  decision,
  size = "md",
  className,
}: DecisionBadgeProps) => {
  const { label, icon: Icon, classes, meaning } = tones[decision];
  return (
    <span
      title={meaning}
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tracking-wider",
        sizes[size],
        classes,
        className
      )}
    >
      <Icon aria-hidden className={size === "lg" ? "size-5" : "size-3.5"} />
      {label}
    </span>
  );
};
