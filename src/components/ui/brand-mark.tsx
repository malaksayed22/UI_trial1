import { cn } from "@/lib/cn";

/** Three trace nodes joined by a path; the last one is the decision. */
export const BrandMark = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn(
      "flex size-8 items-center justify-center rounded-[9px] border border-line-strong bg-raised",
      className
    )}
  >
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none">
      <path d="M3 14 L9 7 L16 11" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="3" cy="14" r="1.8" fill="currentColor" fillOpacity="0.7" />
      <circle cx="9" cy="7" r="1.8" fill="currentColor" fillOpacity="0.7" />
      <circle cx="16" cy="11" r="2.6" fill="var(--color-ink)" />
    </svg>
  </span>
);
