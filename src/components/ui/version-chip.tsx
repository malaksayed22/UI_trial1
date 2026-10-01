import { cn } from "@/lib/cn";

type VersionChipProps = {
  /** Artifact type, e.g. "model" or "prompt". */
  kind: string;
  value: string;
  className?: string;
};

/** Wraps instead of truncating so the differentiating version suffix stays visible. */
export const VersionChip = ({ kind, value, className }: VersionChipProps) => (
  <span
    className={cn(
      "inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 rounded-md border border-line-strong bg-raised px-2 py-1 font-mono text-xs",
      className
    )}
  >
    <span className="text-faint">{kind}</span>
    <span className="break-all text-ink">{value}</span>
  </span>
);
