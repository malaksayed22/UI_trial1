"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { PaletteTrigger } from "@/components/command-palette";
import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { gsap, ScrollTrigger, useGSAP } from "./motion";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#screens", label: "Screens" },
  { href: "#method", label: "Method" },
] as const;

export const LandingNav = () => {
  const root = useRef<HTMLElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useGSAP(
    () => {
      const trigger = ScrollTrigger.create({
        start: 24,
        onUpdate: self => setScrolled(self.scroll() > 24),
      });
      const bar = gsap.fromTo(
        progress.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.2 },
        }
      );
      return () => {
        trigger.kill();
        bar.scrollTrigger?.kill();
      };
    },
    { scope: root }
  );

  return (
    <header
      ref={root}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-line bg-canvas/70 backdrop-blur-xl"
          : "border-b border-transparent"
      )}
    >
      <nav
        aria-label="Landing"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"
      >
        <a href="#top" className="flex items-center gap-3">
          <BrandMark className="text-ink" />
          <span className="text-[15px] font-medium tracking-tight">
            TrustOps
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-4 py-2 text-sm text-muted transition-colors duration-200 hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <PaletteTrigger />
          <Link
            href={routes.overview}
            className="group flex items-center gap-1.5 rounded-full border border-line-strong bg-raised/60 py-2 pl-4 pr-3 text-sm text-ink transition-[border-color,background-color,transform] duration-200 hover:border-muted/50 hover:bg-raised active:scale-[0.97]"
          >
            Open console
            <ArrowUpRight
              aria-hidden
              className="size-4 text-muted transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-ink"
            />
          </Link>
        </div>
      </nav>
      <span
        ref={progress}
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-ink/60"
        style={{ transform: "scaleX(0)" }}
      />
    </header>
  );
};
