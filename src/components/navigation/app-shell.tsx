"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette, PaletteTrigger } from "@/components/command-palette";
import { consolePaletteItems } from "@/components/palette-items";
import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/lib/cn";
import type { DataSourceKind, Viewer } from "@/types";
import { routes } from "@/lib/routes";
import type { FeaturedTraces } from "@/lib/featured-traces";
import { buildNavItems } from "./nav-items";

type AppShellProps = {
  viewer: Viewer | null;
  dataSource: DataSourceKind;
  featured: FeaturedTraces;
  children: ReactNode;
};

const roleText = {
  engineer: "Engineer",
  reviewer: "Reviewer",
  admin: "Admin",
} as const;

export const AppShell = ({
  viewer,
  dataSource,
  featured,
  children,
}: AppShellProps) => {
  const pathname = usePathname();
  // Remembering where the drawer was opened closes it on any navigation
  // without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const drawerOpen = openedAt === pathname;
  const items = buildNavItems(pathname, featured);
  const paletteItems = consolePaletteItems(items);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedAt(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-ink px-3 py-2 text-canvas focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpenedAt(null)}
          className="fixed inset-0 z-30 bg-canvas/70 lg:hidden"
        />
      )}

      <aside
        id="primary-navigation"
        data-open={drawerOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface px-4 py-5 transition-transform duration-200",
          "max-lg:invisible max-lg:-translate-x-full data-[open=true]:max-lg:visible data-[open=true]:max-lg:translate-x-0"
        )}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href={routes.overview} className="flex items-center gap-3">
            <BrandMark className="text-ink" />
            <span>
              <span className="block text-[15px] font-medium tracking-tight">
                TrustOps
              </span>
              <span className="block font-mono text-[11px] tracking-wider text-faint">
                Reliability console
              </span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpenedAt(null)}
            className="rounded-md p-1.5 text-muted hover:text-ink lg:hidden"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1">
          <ul className="space-y-1">
            {items.map(({ key, number, label, icon: Icon, href, active }) => (
              <li key={key}>
                {href ? (
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors duration-200",
                      active
                        ? "border-line-strong bg-raised text-ink before:absolute before:inset-y-2 before:-left-[17px] before:w-0.5 before:rounded-full before:bg-ink"
                        : "border-transparent text-muted hover:bg-raised/60 hover:text-ink"
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn(
                        "size-4",
                        active ? "text-ink" : "text-faint"
                      )}
                    />
                    {label}
                    <span className="ml-auto font-mono text-xs text-faint">
                      {number}
                    </span>
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Open a trace from the Trace Explorer to use this screen"
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-faint/70"
                  >
                    <Icon aria-hidden className="size-4" />
                    {label}
                    <span className="ml-auto font-mono text-xs">{number}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 px-3 text-xs text-faint">
            Screens 04–06 open the selected trace, or the latest flagged one.
          </p>
        </nav>

        {viewer && (
          <div className="flex items-center gap-3 border-t border-line pt-4">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-raised font-mono text-xs text-info"
            >
              {viewer.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{viewer.name}</p>
              <p className="font-mono text-xs text-faint">
                {roleText[viewer.role]}
              </p>
            </div>
          </div>
        )}
      </aside>

      <CommandPalette items={paletteItems} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-canvas/85 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="primary-navigation"
              onClick={() => setOpenedAt(pathname)}
              className="rounded-md p-2 text-muted hover:bg-raised hover:text-ink lg:hidden"
            >
              <Menu aria-hidden className="size-5" />
            </button>
            <p className="hidden font-mono text-xs uppercase tracking-wider text-faint sm:block">
              TrustOps <span aria-hidden>›</span> Reliability console
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PaletteTrigger />
            <p
              title={
                dataSource === "fixture"
                  ? "Values come from reviewed fixtures, not live evaluation results."
                  : "Values come from the live platform API."
              }
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-xs",
                dataSource === "fixture"
                  ? "border-review/40 bg-review/10 text-review"
                  : "border-pass/40 bg-pass/10 text-pass"
              )}
            >
              {dataSource === "fixture" ? "Fixture data" : "Live API"}
            </p>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
