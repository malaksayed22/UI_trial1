import { AlertOctagon, CircleSlash, Hourglass } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatScore } from "@/lib/format";
import type { Measurement } from "@/types";

type MeasurementValueProps = {
  measurement: Measurement;
  /** Show "higher/lower is better" next to a scored value. */
  showDirection?: boolean;
  className?: string;
};

const directionText = {
  higher_is_better: "higher is better",
  lower_is_better: "lower is better",
} as const;

/**
 * Renders a measurement without ever turning a missing result into zero:
 * not evaluated, evaluator failed and not applicable each have their own state.
 */
export const MeasurementValue = ({
  measurement,
  showDirection = false,
  className,
}: MeasurementValueProps) => {
  switch (measurement.status) {
    case "scored":
      return (
        <span className={cn("inline-flex items-baseline gap-2", className)}>
          <span className="font-mono text-ink tabular-nums">
            {formatScore(measurement.value)}
          </span>
          {showDirection && (
            <span className="whitespace-nowrap text-xs text-faint">
              {directionText[measurement.direction]} · {measurement.range[0]}–
              {measurement.range[1]}
            </span>
          )}
        </span>
      );
    case "not_evaluated":
      return (
        <span className={cn("inline-flex items-center gap-1.5 text-muted", className)}>
          <Hourglass aria-hidden className="size-3.5" />
          Not evaluated
        </span>
      );
    case "evaluator_failed":
      return (
        <span
          className={cn("inline-flex items-center gap-1.5 text-review", className)}
          title={measurement.reason}
        >
          <AlertOctagon aria-hidden className="size-3.5" />
          Evaluator failed
          <span className="sr-only">: {measurement.reason}</span>
        </span>
      );
    case "not_applicable":
      return (
        <span
          className={cn("inline-flex items-center gap-1.5 text-faint", className)}
          title={measurement.reason}
        >
          <CircleSlash aria-hidden className="size-3.5" />
          Not applicable
          <span className="sr-only">: {measurement.reason}</span>
        </span>
      );
  }
};

/** Short reason text for non-scored measurements, for use under a label. */
export const measurementNote = (measurement: Measurement) =>
  "reason" in measurement ? measurement.reason : null;
