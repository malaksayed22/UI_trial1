import Link from "next/link";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export type TraceView = "detail" | "rag" | "investigation";

const tabs: { view: TraceView; label: string; href: (traceId: string) => string }[] = [
  { view: "detail", label: "Trace Detail", href: routes.trace },
  { view: "rag", label: "RAG Diagnostics", href: routes.rag },
  { view: "investigation", label: "Failure & RCA", href: routes.investigation },
];

type TraceTabsProps = { traceId: string; current: TraceView };

/** Moves between the three screens that describe the same trace. */
export const TraceTabs = ({ traceId, current }: TraceTabsProps) => (
  <nav aria-label="Views for this trace" className="mb-6">
    <ul className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
      {tabs.map(tab => (
        <li key={tab.view}>
          <Link
            href={tab.href(traceId)}
            aria-current={tab.view === current ? "page" : undefined}
            className={cn(
              "block rounded-md px-3 py-1.5 text-sm transition-colors",
              tab.view === current
                ? "bg-info/15 text-info"
                : "text-muted hover:bg-raised hover:text-ink"
            )}
          >
            {tab.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);
