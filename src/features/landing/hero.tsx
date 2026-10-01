"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { routes } from "@/lib/routes";
import { gsap, MOTION_OK, MOTION_REDUCED, SplitText, useGSAP } from "./motion";
import { Magnetic } from "./primitives";
import { TraceReplay } from "./trace-replay";

const proof = [
  { value: "3,038", label: "traces evaluated" },
  { value: "6", label: "evaluator families" },
  { value: "PASS · REVIEW · BLOCK", label: "one defensible verdict" },
] as const;

export const Hero = () => {
  const root = useRef<HTMLElement>(null);
  const field = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_REDUCED, () => {
        gsap.set(q(".pre-anim"), { autoAlpha: 1 });
      });

      mm.add(MOTION_OK, () => {
        let split: SplitText | undefined;
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } });

        const fades = q("[data-fade]");
        const frame = q("[data-frame]");
        gsap.set([...fades, ...frame], { autoAlpha: 0 });

        document.fonts.ready.then(() => {
          const headline = q("[data-headline]")[0];
          if (!headline) return;
          gsap.set(headline, { autoAlpha: 1 });
          split = SplitText.create(headline, { type: "lines", mask: "lines", linesClass: "pb-[0.08em]" });
          intro
            .fromTo(split.lines, { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.1 })
            .fromTo(fades, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.09 }, 0.55)
            .fromTo(frame, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 1.4 }, 0.7);
        });

        // The frame tilts back to flat as the hero scrolls away.
        gsap.fromTo(
          q("[data-frame-tilt]"),
          { rotateX: 9, scale: 0.965, transformOrigin: "50% 0%" },
          {
            rotateX: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: q("[data-frame]")[0], start: "top 92%", end: "top 28%", scrub: 0.6 },
          }
        );

        const onPointerMove = (event: PointerEvent) => {
          const box = root.current?.getBoundingClientRect();
          if (!box || !field.current) return;
          field.current.style.setProperty("--mx", `${event.clientX - box.left}px`);
          field.current.style.setProperty("--my", `${event.clientY - box.top}px`);
        };
        const target = root.current;
        target?.addEventListener("pointermove", onPointerMove);

        return () => {
          target?.removeEventListener("pointermove", onPointerMove);
          intro.kill();
          split?.revert();
        };
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} id="top" className="relative overflow-hidden pb-24 pt-32 sm:pt-36">
      <div aria-hidden className="hero-light pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
      <div ref={field} aria-hidden className="hero-field pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p
          data-fade
          className="pre-anim inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 py-1.5 pl-2 pr-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
        >
          <span className="rounded-full bg-raised px-2 py-0.5 text-ink">v0.9</span>
          Trace-based reliability for agentic AI
        </p>

        <h1
          data-headline
          className="pre-anim mt-8 max-w-6xl text-[clamp(2.8rem,7vw,6.3rem)] font-medium leading-[0.96] tracking-[-0.045em]"
        >
          Know what your AI <em className="pr-[0.06em] font-serif font-normal italic tracking-[-0.02em] text-muted">actually</em> did,
          before it ships.
        </h1>

        <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p data-fade className="pre-anim max-w-[34rem] text-lg leading-relaxed text-muted">
            TrustOps reconstructs the hidden execution path behind every response, scores it with
            evidence, ranks the root cause, and resolves each release to a decision your team can defend.
          </p>

          <div data-fade className="pre-anim flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link
                href={routes.overview}
                className="group flex items-center gap-2 rounded-full bg-ink py-3.5 pl-6 pr-5 text-[15px] font-medium text-canvas transition-[transform,background-color] duration-200 hover:bg-white active:scale-[0.97]"
              >
                Enter the console
                <ArrowUpRight aria-hidden className="size-4 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px" />
              </Link>
            </Magnetic>
            <a
              href="#how"
              className="group flex items-center gap-2 rounded-full border border-line-strong px-6 py-3.5 text-[15px] text-ink transition-[border-color,background-color,transform] duration-200 hover:border-muted/50 hover:bg-raised/60 active:scale-[0.97]"
            >
              See how it works
              <ArrowRight aria-hidden className="size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <dl data-fade className="pre-anim mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {proof.map(item => (
            <div key={item.label} className="bg-canvas px-5 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-widest text-faint">{item.label}</dt>
              <dd className="mt-1.5 text-xl font-medium tracking-tight tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div data-frame className="pre-anim mt-16 [perspective:1600px]">
          <div data-frame-tilt className="will-change-transform">
            <TraceReplay />
          </div>
        </div>
      </div>
    </section>
  );
};
