import type { ReactNode } from "react";

type TableScrollProps = {
  /** Accessible name for the scrollable region. */
  label: string;
  children: ReactNode;
};

/**
 * Keyboard-focusable horizontal scroller so wide tables stay usable on phones.
 * Edge shadows signal when more columns are hidden off-screen.
 */
export const TableScroll = ({ label, children }: TableScrollProps) => (
  <div
    role="region"
    aria-label={label}
    tabIndex={0}
    className="scroll-shadow-x overflow-x-auto rounded-md"
  >
    {children}
  </div>
);

export const tableHeadClass =
  "px-3 py-3 text-left font-mono text-xs font-normal uppercase tracking-wider text-faint";

export const tableCellClass = "px-3 py-3 align-top text-sm";
