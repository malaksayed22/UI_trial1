"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export type PaletteItem = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
  keywords?: string;
};

const OPEN_EVENT = "trustops:open-palette";

/** Lets any button open the palette without sharing state. */
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

const matches = (item: PaletteItem, query: string) => {
  const haystack = `${item.label} ${item.group} ${item.hint ?? ""} ${item.keywords ?? ""}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every(token => haystack.includes(token));
};

const Kbd = ({ children }: { children: string }) => (
  <kbd className="rounded border border-line-strong bg-raised px-1.5 py-0.5 font-mono text-[10px] text-muted">
    {children}
  </kbd>
);

/** ⌘K / Ctrl+K navigator. Items render as real links so middle-click and hash anchors keep working. */
export const CommandPalette = ({ items }: { items: PaletteItem[] }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const returnFocus = useRef<Element | null>(null);
  const rows = useRef<(HTMLAnchorElement | null)[]>([]);

  const show = useCallback(() => {
    returnFocus.current = document.activeElement;
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) hide();
        else show();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, [open, show, hide]);

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  const results = useMemo(() => items.filter(item => matches(item, query)), [items, query]);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    if (open) rows.current[current]?.scrollIntoView({ block: "nearest" });
  }, [current, open]);

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const count = results.length;
    if (event.key === "Escape") {
      event.preventDefault();
      hide();
    } else if (event.key === "ArrowDown" && count) {
      event.preventDefault();
      setActive((current + 1) % count);
    } else if (event.key === "ArrowUp" && count) {
      event.preventDefault();
      setActive((current - 1 + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      rows.current[current]?.click();
    } else if (event.key === "Tab") {
      event.preventDefault();
    }
  };

  const activeId = results[current] ? `palette-${results[current].id}` : undefined;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            type="button"
            aria-label="Close command palette"
            tabIndex={-1}
            onClick={hide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="absolute inset-0 cursor-default bg-canvas/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            data-lenis-prevent
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: -8, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -4, filter: "blur(4px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-surface/95 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search aria-hidden className="size-4 shrink-0 text-faint" />
              <input
                autoFocus
                role="combobox"
                aria-expanded
                aria-controls="palette-list"
                aria-activedescendant={activeId}
                aria-label="Search screens and traces"
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search screens, traces, gates…"
                className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              />
              <Kbd>esc</Kbd>
            </div>

            <ul id="palette-list" role="listbox" aria-label="Results" className="max-h-[min(55vh,26rem)] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-10 text-center text-sm text-muted">
                  Nothing matches “{query}”.
                  <span className="mt-1 block text-faint">Try a screen name, or part of a trace ID like 8f21c9a4.</span>
                </li>
              )}
              {results.map((item, index) => {
                const isActive = index === current;
                const showGroup = index === 0 || results[index - 1]?.group !== item.group;
                const shared = {
                  id: `palette-${item.id}`,
                  role: "option" as const,
                  "aria-selected": isActive,
                  onClick: hide,
                  onMouseMove: () => setActive(index),
                  className: cn(
                    "flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm transition-colors duration-100",
                    isActive ? "bg-raised text-ink" : "text-muted"
                  ),
                };
                const content = (
                  <>
                    <span className="truncate">{item.label}</span>
                    <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-faint">
                      {item.hint}
                      {isActive && <CornerDownLeft aria-hidden className="size-3" />}
                    </span>
                  </>
                );
                return (
                  <li key={item.id} role="presentation">
                    {showGroup && (
                      <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                        {item.group}
                      </p>
                    )}
                    {item.href.startsWith("#") ? (
                      <a ref={el => void (rows.current[index] = el)} href={item.href} {...shared}>
                        {content}
                      </a>
                    ) : (
                      <Link ref={el => void (rows.current[index] = el)} href={item.href} {...shared}>
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[11px] text-faint">
              <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
              <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> open</span>
              <span className="ml-auto">{results.length} results</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/** Compact trigger that shows the shortcut; opens the palette via the shared event. */
export const PaletteTrigger = ({ className }: { className?: string }) => (
  <button
    type="button"
    onClick={openCommandPalette}
    aria-label="Open command palette"
    className={cn(
      "group flex items-center gap-2.5 rounded-full border border-line-strong bg-raised/50 py-1.5 pl-3 pr-2 text-sm text-muted transition-[border-color,background-color,transform] duration-200 hover:border-muted/50 hover:bg-raised hover:text-ink active:scale-[0.97]",
      className
    )}
  >
    <Search aria-hidden className="size-3.5" />
    <span className="hidden sm:inline">Search</span>
    <kbd className="hidden rounded border border-line-strong px-1.5 py-0.5 font-mono text-[10px] text-faint sm:inline">⌘K</kbd>
  </button>
);
