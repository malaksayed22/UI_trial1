"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { popoverMotion, popoverSurfaceClass, useDismiss } from "./popover";

type DateFieldProps = {
  label: string;
  /** ISO date (YYYY-MM-DD) or "" when unset. */
  value: string;
  placeholder: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
};

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DAY_MS = 86_400_000;

const MONTH_TITLE = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Dates are handled as UTC midnight so the picker never drifts with the viewer's timezone. */
const parseIso = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
};
const toIso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => toIso(new Date(parseIso(iso).getTime() + days * DAY_MS));
const addMonths = (iso: string, months: number) => {
  const date = parseIso(iso);
  return toIso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)));
};
const firstOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`;

/** Six Monday-first weeks, so the popover height never jumps between months. */
const monthGrid = (monthStart: string) => {
  const start = parseIso(monthStart);
  const offset = (start.getUTCDay() + 6) % 7;
  const gridStart = start.getTime() - offset * DAY_MS;
  return Array.from({ length: 42 }, (_, index) => toIso(new Date(gridStart + index * DAY_MS)));
};

const todayIso = () => toIso(new Date());

/** Calendar popover replacing the native date input; same ISO contract as the URL param. */
export const DateField = ({ label, value, placeholder, min, max, onChange }: DateFieldProps) => {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(value || todayIso());
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  useDismiss(open, () => setOpen(false), containerRef, triggerRef);

  const isDisabled = (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max);

  const focusDay = (iso: string) => {
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus(),
    );
  };

  const openPicker = () => {
    setCursor(value || todayIso());
    setOpen(true);
    focusDay(value || todayIso());
  };

  const choose = (iso: string) => {
    if (isDisabled(iso)) return;
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveCursor = (iso: string) => {
    setCursor(iso);
    focusDay(iso);
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const step = steps[event.key];
    if (step !== undefined) {
      event.preventDefault();
      return moveCursor(addDays(cursor, step));
    }
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      moveCursor(addMonths(cursor, event.key === "PageUp" ? -1 : 1));
    }
  };

  const monthStart = firstOfMonth(cursor);
  const days = monthGrid(monthStart);
  const today = todayIso();
  const hasValue = value !== "";

  return (
    <div ref={containerRef} className="relative">
      <span id={`${baseId}-label`} className="mb-1.5 block text-xs text-muted">
        {label}
      </span>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={`${baseId}-label ${baseId}-value`}
          onClick={() => (open ? setOpen(false) : openPicker())}
          className={cn(
            "group flex h-11 w-full items-center gap-2.5 rounded-xl border bg-canvas/60 pl-3.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[border-color,background-color,box-shadow] duration-150",
            hasValue ? "pr-10" : "pr-3.5",
            open
              ? "border-info/60 bg-canvas shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-info)_16%,transparent)]"
              : "border-line-strong hover:border-faint/60 hover:bg-canvas",
          )}
        >
          <CalendarDays
            aria-hidden
            className={cn("size-4 shrink-0 transition-colors", open || hasValue ? "text-info" : "text-faint")}
          />
          <span
            id={`${baseId}-value`}
            className={cn("truncate tabular-nums", hasValue ? "text-ink" : "text-muted")}
          >
            {hasValue ? SHORT_DATE.format(parseIso(value)) : placeholder}
          </span>
        </button>
        {hasValue && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={`Choose ${label}`}
            {...popoverMotion(reduceMotion)}
            className={cn(popoverSurfaceClass, "w-72 p-3")}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCursor(addMonths(cursor, -1))}
                className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <p aria-live="polite" className="text-sm font-medium text-ink">
                {MONTH_TITLE.format(parseIso(monthStart))}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCursor(addMonths(cursor, 1))}
                className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 pb-1 text-center text-[11px] text-faint" aria-hidden>
              {WEEKDAYS.map(day => (
                <span key={day} className="py-1">{day}</span>
              ))}
            </div>

            <div ref={gridRef} role="grid" onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-0.5">
              {days.map(iso => {
                const inMonth = iso.slice(0, 7) === monthStart.slice(0, 7);
                const selected = iso === value;
                const disabled = isDisabled(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    data-date={iso}
                    tabIndex={iso === cursor ? 0 : -1}
                    disabled={disabled}
                    aria-selected={selected}
                    aria-current={iso === today ? "date" : undefined}
                    aria-label={SHORT_DATE.format(parseIso(iso))}
                    onClick={() => choose(iso)}
                    className={cn(
                      "grid h-9 place-items-center rounded-lg text-sm tabular-nums transition-colors duration-100",
                      selected
                        ? "bg-info font-medium text-canvas"
                        : inMonth
                          ? "text-ink hover:bg-canvas"
                          : "text-faint/70 hover:bg-canvas",
                      iso === today && !selected && "ring-1 ring-inset ring-info/50",
                      disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                    )}
                  >
                    {Number(iso.slice(8))}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-xs">
              <button
                type="button"
                onClick={() => choose(today)}
                disabled={isDisabled(today)}
                className="rounded-md px-2 py-1 text-info transition-colors hover:bg-info/10 disabled:opacity-30"
              >
                Today
              </button>
              {hasValue && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className="rounded-md px-2 py-1 text-muted transition-colors hover:bg-canvas hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
