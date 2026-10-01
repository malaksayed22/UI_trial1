"use client";

import { useRef } from "react";
import { failureClasses, principles, rigorStats } from "./data";
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from "./motion";
import { CountUp, Eyebrow } from "./primitives";

const MANIFESTO =
  "Final answers are not enough. A decision should never be just a number. It should be an argument, with exhibits, that a skeptical reviewer can take apart.";

const MarqueeRow = ({ reverse = false }: { reverse?: boolean }) => {
  const items = reverse ? [...failureClasses].reverse() : failureClasses;
  return (
    <div className="marquee marquee-mask overflow-hidden">
      <div className="marquee-track" data-reverse={reverse}>
        {[0, 1].map(copy => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-3 pr-3">
            {items.map(item => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2.5 font-mono text-[13px] text-muted"
              >
                {item.label}
                <span className="text-ink tabular-nums">{item.count}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
};

export const Method = () => {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const target = q("[data-manifesto]")[0];
        if (!target) return;
        let split: SplitText | undefined;
        let scrub: gsap.core.Tween | undefined;
        document.fonts.ready.then(() => {
          split = SplitText.create(target, { type: "words" });
          scrub = gsap.fromTo(
            split.words,
            { opacity: 0.14 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.12,
              scrollTrigger: { trigger: target, start: "top 82%", end: "bottom 45%", scrub: 0.5 },
            }
          );
          ScrollTrigger.refresh();
        });
        return () => {
          scrub?.scrollTrigger?.kill();
          scrub?.kill();
          split?.revert();
        };
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} id="method" className="relative border-t border-line py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div data-reveal>
          <Eyebrow>What it catches</Eyebrow>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Failures are labelled, counted and ranked, so “the AI got worse” becomes a specific class with a number next to it.
          </p>
        </div>
      </div>

      <div data-reveal className="mt-10 space-y-3">
        <MarqueeRow />
        <MarqueeRow reverse />
      </div>

      <div className="mx-auto mt-32 max-w-7xl px-5 sm:mt-44 sm:px-8">
        <Eyebrow>Built to be defended</Eyebrow>
        <p
          data-manifesto
          className="mt-8 max-w-5xl text-[clamp(1.9rem,4.4vw,3.6rem)] font-medium leading-[1.12] tracking-[-0.03em]"
        >
          {MANIFESTO}
        </p>

        <dl className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {rigorStats.map(stat => (
            <div key={stat.label} data-reveal className="bg-canvas p-6 sm:p-8">
              <dd className="text-5xl font-medium tracking-[-0.04em] sm:text-6xl">
                <CountUp to={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
              </dd>
              <dt className="mt-4 text-[15px] text-ink">{stat.label}</dt>
              <dd className="mt-1 font-mono text-[11px] uppercase tracking-widest text-faint">{stat.note}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-16 grid gap-10 md:grid-cols-3">
          {principles.map((principle, index) => (
            <li key={principle.title} data-reveal className="border-t border-line-strong pt-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">0{index + 1}</p>
              <h3 className="mt-3 text-xl font-medium tracking-tight">{principle.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{principle.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
