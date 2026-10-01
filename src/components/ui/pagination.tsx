import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
};

/** Page numbers to show: first, last, and a window around the current page. */
export const visiblePages = (page: number, pageCount: number): (number | "gap")[] => {
  const wanted = new Set(
    [1, pageCount, page - 1, page, page + 1].filter(
      value => value >= 1 && value <= pageCount
    )
  );
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((value, index) => {
    const previous = sorted[index - 1];
    return previous !== undefined && value - previous > 1
      ? ["gap" as const, value]
      : [value];
  });
};

const itemClasses =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 font-mono text-xs";

export const Pagination = ({ page, pageCount, hrefFor }: PaginationProps) => {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          aria-label="Previous page"
          className={cn(itemClasses, "border-line-strong text-muted hover:text-ink")}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
      ) : null}
      {visiblePages(page, pageCount).map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-faint">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={hrefFor(entry)}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              itemClasses,
              entry === page
                ? "border-info/50 bg-info/15 text-info"
                : "border-transparent text-muted hover:border-line-strong hover:text-ink"
            )}
          >
            {entry}
          </Link>
        )
      )}
      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          aria-label="Next page"
          className={cn(itemClasses, "border-line-strong text-muted hover:text-ink")}
        >
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
};
