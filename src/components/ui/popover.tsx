"use client";

import { useEffect, type RefObject } from "react";

/** Closes a popover on outside pointer-down or Escape, returning focus to its trigger. */
export const useDismiss = (
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
) => {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (containerRef.current?.contains(event.target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, containerRef, triggerRef]);
};

export const popoverSurfaceClass =
  "absolute left-0 top-full z-30 mt-2 origin-top rounded-xl border border-line-strong bg-raised shadow-[0_18px_48px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)]";

export const popoverMotion = (reduceMotion: boolean | null) => ({
  initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.14, ease: [0.25, 1, 0.5, 1] as const },
});
