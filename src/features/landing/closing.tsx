"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import { routes } from "@/lib/routes";
import { gsap, MOTION_OK, MOTION_REDUCED, SplitText, useGSAP } from "./motion";
import { Magnetic } from "./primitives";

export const Closing = () => {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_REDUCED, () => {
        gsap.set(q(".pre-anim"), { autoAlpha: 1 });
      });

      mm.add(MOTION_OK, () => {
        const headline = q("[data-closing-headline]")[0];
        const rest = q("[data-closing-fade]");
        if (!headline) return;
        gsap.set(rest, { autoAlpha: 0, y: 20 });
        let split: SplitText | undefined;

        document.fonts.ready.then(() => {
          gsap.set(headline, { autoAlpha: 1 });
          split = SplitText.create(headline, { type: "lines", mask: "lines", linesClass: "pb-[0.1em]" });
          gsap
            .timeline({ scrollTrigger: { trigger: headline, start: "top 80%", once: true } })
            .fromTo(split.lines, { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.12, ease: "expo.out" })
            .fromTo(rest, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "expo.out" }, 0.5);
        });

        return () => split?.revert();
      });
    },
    { scope: root }
  );

  return (
    <section id="closing" ref={root} className="relative overflow-hidden border-t border-line">
      <div aria-hidden className="grain pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%]"
        style={{ background: "radial-gradient(55% 80% at 50% 100%, rgb(255 255 255 / 0.07), transparent 70%)" }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-48">
        <h2
          data-closing-headline
          className="pre-anim max-w-5xl text-[clamp(2.8rem,8vw,7rem)] font-medium leading-[0.98] tracking-[-0.045em]"
        >
          Make every decision{" "}
          <em className="pr-[0.06em] font-serif font-normal italic tracking-[-0.02em] text-muted">worth</em> trusting.
        </h2>
        <p data-closing-fade className="pre-anim mt-8 max-w-lg text-lg leading-relaxed text-muted">
          Open the console and follow a real investigation from the first retrieval to the final verdict.
        </p>
        <div data-closing-fade className="pre-anim mt-10">
          <Magnetic strength={0.35}>
            <Link
              href={routes.overview}
              className="group flex items-center gap-2.5 rounded-full bg-ink py-4 pl-8 pr-6 text-base font-medium text-canvas transition-[transform,background-color] duration-200 hover:bg-white active:scale-[0.97]"
            >
              Enter the console
              <ArrowUpRight aria-hidden className="size-[18px] transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px" />
            </Link>
          </Magnetic>
        </div>
      </div>

      <footer className="relative border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <BrandMark className="text-ink" />
            <div>
              <p className="text-sm font-medium tracking-tight">TrustOps</p>
              <p className="font-mono text-[11px] text-faint">Trace-based reliability</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-faint">
            A graduation project in reliability, evaluation and governance for generative and agentic AI.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-faint">© 2026 · v0.9</p>
        </div>
      </footer>
    </section>
  );
};
