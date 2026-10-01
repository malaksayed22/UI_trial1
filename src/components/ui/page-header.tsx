import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

/** Every screen opens with the reviewer question it answers. */
export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) => (
  <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-faint">
        <span aria-hidden className="h-px w-5 bg-line-strong" />
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-[2.6rem]">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
    </div>
    {actions}
  </header>
);
