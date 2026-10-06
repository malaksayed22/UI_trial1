"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useId, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type SearchFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  pending?: boolean;
  onChange: (value: string) => void;
};

/** Focus the field with "/" from anywhere that isn't already a text input. */
const useSlashToFocus = (inputRef: React.RefObject<HTMLInputElement | null>) => {
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [inputRef]);
};

export const SearchField = ({ label, value, placeholder, pending = false, onChange }: SearchFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  useSlashToFocus(inputRef);

  const clear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && value) {
      event.preventDefault();
      onChange("");
    }
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-muted">
        {label}
      </label>
      <div className="group relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-faint transition-colors group-focus-within:text-info"
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-12 w-full rounded-xl border border-line-strong bg-canvas/60 pl-11 pr-20 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,background-color,box-shadow] duration-150",
            "placeholder:text-faint hover:border-faint/60 hover:bg-canvas",
            "focus:border-info/60 focus:bg-canvas focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-info)_16%,transparent)]",
          )}
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {pending && (
            <LoaderCircle aria-hidden className="size-4 animate-spin text-info motion-reduce:animate-none" />
          )}
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clear}
              className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-ink"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          ) : (
            <kbd
              aria-hidden
              className="rounded-md border border-line-strong bg-raised px-1.5 py-0.5 font-mono text-[11px] text-faint"
            >
              /
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
};
