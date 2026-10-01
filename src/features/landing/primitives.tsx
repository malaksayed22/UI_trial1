"use client";

import Link from "next/link";
import { useRef, type ComponentPropsWithoutRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "./motion";

type SpotlightProps = ComponentPropsWithoutRef<"div"> & { href?: string; label?: string };

/** Card whose border and surface are lit by the cursor (see `.spot` in landing.css). */
export const SpotlightCard = ({ className, children, href, label, ...props }: SpotlightProps) => {
  const onMove = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--y", `${event.clientY - box.top}px`);
  };

  if (href) {
    return (
      <div className={cn("spot group relative", className)} onPointerMove={onMove} {...props}>
        <Link href={href} aria-label={label} className="absolute inset-0 z-20 rounded-[inherit]" />
        {children}
      </div>
    );
  }
  return (
    <div className={cn("spot group relative", className)} onPointerMove={onMove} {...props}>
      {children}
    </div>
  );
};

type MagneticProps = { children: ReactNode; className?: string; strength?: number };

/** Pulls its child toward the pointer. No-ops for touch devices and reduced motion. */
export const Magnetic = ({ children, className, strength = 0.28 }: MagneticProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (hover: hover)`, () => {
        const el = ref.current;
        if (!el) return;
        const moveX = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.6)" });
        const moveY = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.6)" });
        const onMove = (event: globalThis.PointerEvent) => {
          const box = el.getBoundingClientRect();
          moveX((event.clientX - (box.left + box.width / 2)) * strength);
          moveY((event.clientY - (box.top + box.height / 2)) * strength);
        };
        const onLeave = () => {
          moveX(0);
          moveY(0);
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: ref }
  );

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {children}
    </span>
  );
};

type CountUpProps = { to: number; decimals?: number; suffix?: string; className?: string };

/** Renders the final value for no-JS and reduced motion; counts up once when scrolled into view. */
export const CountUp = ({ to, decimals = 0, suffix = "", className }: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const counter = { value: 0 };
        el.textContent = format(0);
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: "top 92%",
          once: true,
          onEnter: () =>
            gsap.to(counter, {
              value: to,
              duration: 1.8,
              ease: "expo.out",
              onUpdate: () => {
                el.textContent = format(counter.value);
              },
            }),
        });
        return () => trigger.kill();
      });
    },
    { scope: ref }
  );

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(to)}
    </span>
  );
};

/** Mono micro-label used for section eyebrows. */
export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p
    className={cn(
      "flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-faint",
      className
    )}
  >
    <span aria-hidden className="h-px w-6 bg-line-strong" />
    {children}
  </p>
);
