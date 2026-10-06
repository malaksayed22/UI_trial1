"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { openCommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/cn";
import { ScrollTrigger, useGSAP } from "./motion";

const sections = [
  { id: "top", label: "Overview" },
  { id: "how", label: "How it works" },
  { id: "screens", label: "Screens" },
  { id: "method", label: "Method" },
] as const;

type SectionId = (typeof sections)[number]["id"];

/** Floating dock that tracks the current section and expands on hover or focus. */
export const SectionIsland = () => {
  const anchor = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<SectionId>("top");
  const [pastIntro, setPastIntro] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  // The dock would cover the closing call to action and footer, so it steps aside there.
  const visible = pastIntro && !atEnd;

  useGSAP(
    () => {
      // Resolve against the document: useGSAP scopes string selectors to its own ref.
      const find = (id: string) => document.getElementById(id) ?? undefined;
      const triggers = sections.flatMap(({ id }) => {
        const trigger = find(id);
        if (!trigger) return [];
        return ScrollTrigger.create({
          trigger,
          start: "top 55%",
          end: "bottom 55%",
          refreshPriority: -1,
          onToggle: self => {
            if (self.isActive) setActiveId(id);
          },
        });
      });
      const how = find("how");
      const reveal = how
        ? ScrollTrigger.create({
            trigger: how,
            start: "top 85%",
            refreshPriority: -1,
            onUpdate: self => setPastIntro(self.progress > 0),
          })
        : undefined;
      const closing = find("closing");
      const conceal = closing
        ? ScrollTrigger.create({
            trigger: closing,
            start: "top 80%",
            refreshPriority: -1,
            onToggle: self => setAtEnd(self.isActive),
          })
        : undefined;
      return () => [...triggers, reveal, conceal].forEach(trigger => trigger?.kill());
    },
    { scope: anchor }
  );

  const currentIndex = Math.max(
    sections.findIndex(section => section.id === activeId),
    0
  );
  const current = sections[currentIndex];
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };

  return (
    <div ref={anchor} className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <AnimatePresence>
        {visible && current && (
          <motion.nav
            aria-label="Sections"
            layout
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={spring}
            onHoverStart={() => setExpanded(true)}
            onHoverEnd={() => setExpanded(false)}
            onFocus={() => setExpanded(true)}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
            }}
            style={{ borderRadius: 999 }}
            className="pointer-events-auto flex items-center gap-1 border border-line-strong bg-surface/80 p-1.5 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            {expanded ? (
              sections.map(section => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={section.id === activeId ? "true" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-150",
                    section.id === activeId ? "text-canvas" : "text-muted hover:text-ink"
                  )}
                >
                  {section.id === activeId && (
                    <motion.span layoutId="island-pill" transition={spring} className="absolute inset-0 rounded-full bg-ink" />
                  )}
                  <span className="relative">{section.label}</span>
                </a>
              ))
            ) : (
              <span className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-ink">
                <span aria-hidden className="size-1.5 rounded-full bg-pass" />
                {current.label}
                <span className="font-mono text-[11px] text-faint">0{currentIndex + 1}/04</span>
              </span>
            )}
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Open command palette"
              className="ml-1 rounded-full border border-line-strong px-2.5 py-1.5 font-mono text-[11px] text-faint transition-colors duration-150 hover:text-ink pointer-coarse:hidden"
            >
              ⌘K
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};
