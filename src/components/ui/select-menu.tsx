"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { popoverMotion, popoverSurfaceClass, useDismiss } from "./popover";

export type SelectOption = { value: string; label: string };

type SelectMenuProps = {
  label: string;
  value: string;
  /** Label for the empty value, e.g. "All applications". */
  placeholder: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

const wrap = (index: number, length: number) => (index + length) % length;

/**
 * Listbox dropdown replacing the native <select>. Keeps the combobox/listbox
 * ARIA contract: arrows, Home/End, type-ahead, Enter/Space to pick, Esc to close.
 */
export const SelectMenu = ({ label, value, placeholder, options, onChange }: SelectMenuProps) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const baseId = useId();
  const listId = `${baseId}-list`;
  const labelId = `${baseId}-label`;

  const all: SelectOption[] = [{ value: "", label: placeholder }, ...options];
  const selectedIndex = Math.max(0, all.findIndex(option => option.value === value));
  const selected = all[selectedIndex];
  const hasValue = value !== "";

  useDismiss(open, () => setOpen(false), containerRef, triggerRef);

  const openMenu = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };

  const pick = (index: number) => {
    const option = all[index];
    if (option) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const jumpToMatch = (key: string) => {
    const now = Date.now();
    const state = typeahead.current;
    state.text = now - state.at > 600 ? key : state.text + key;
    state.at = now;
    const needle = state.text.toLowerCase();
    const match = all.findIndex(option => option.label.toLowerCase().startsWith(needle));
    if (match < 0) return;
    if (open) setActive(match);
    else openMenu(match);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openMenu();
      setActive(current => wrap(current + (key === "ArrowDown" ? 1 : -1), all.length));
    } else if (key === "Home" || key === "End") {
      if (!open) return;
      event.preventDefault();
      setActive(key === "Home" ? 0 : all.length - 1);
    } else if (key === "Enter" || key === " ") {
      event.preventDefault();
      if (open) pick(active);
      else openMenu();
    } else if (key === "Tab") {
      setOpen(false);
    } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      jumpToMatch(key);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <span id={labelId} className="mb-1.5 block text-xs text-muted">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${baseId}-value`}
        aria-activedescendant={open ? `${baseId}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "group flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-canvas/60 px-3.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[border-color,background-color,box-shadow] duration-150",
          open
            ? "border-info/60 bg-canvas shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-info)_16%,transparent)]"
            : "border-line-strong hover:border-faint/60 hover:bg-canvas",
        )}
      >
        <span id={`${baseId}-value`} className="flex min-w-0 items-center gap-2">
          {hasValue && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-info" />}
          <span className={cn("truncate", hasValue ? "text-ink" : "text-muted")}>
            {selected?.label}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-faint transition-transform duration-200 group-hover:text-muted",
            open && "rotate-180 text-info",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            {...popoverMotion(reduceMotion)}
            className={cn(popoverSurfaceClass, "max-h-72 w-full min-w-48 overflow-y-auto p-1.5")}
          >
            {all.map((option, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={option.value || "__all"}
                  id={`${baseId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => pick(index)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors duration-100",
                    index === active ? "bg-info/12 text-ink" : "text-muted",
                    isSelected && "text-ink",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check aria-hidden className="size-4 shrink-0 text-info" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
