import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Panel = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) => (
  <section
    className={cn("rounded-2xl border border-line bg-surface p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]", className)}
    {...props}
  />
);

type PanelHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  headingId?: string;
};

export const PanelHeader = ({
  title,
  subtitle,
  action,
  headingId,
}: PanelHeaderProps) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div>
      <h2 id={headingId} className="text-base font-medium tracking-tight text-ink">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-xs text-faint">{subtitle}</p>}
    </div>
    {action}
  </div>
);
