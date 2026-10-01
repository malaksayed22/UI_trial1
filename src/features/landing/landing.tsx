"use client";

import { useRef, type RefObject } from "react";
import { Closing } from "./closing";
import { Hero } from "./hero";
import { LandingNav } from "./landing-nav";
import { Method } from "./method";
import { gsap, MOTION_OK, MOTION_REDUCED, ScrollTrigger, useGSAP } from "./motion";
import { Screens } from "./screens";
import { Story } from "./story";
import { useSmoothScroll } from "./use-smooth-scroll";
import "./landing.css";

/** Reveals every `[data-reveal]` block as it enters, in batches so siblings cascade. */
const useScrollReveals = (scope: RefObject<HTMLElement | null>) => {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_REDUCED, () => {
        gsap.set("[data-reveal]", { autoAlpha: 1, y: 0 });
      });
      mm.add(MOTION_OK, () => {
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 90%",
          once: true,
          onEnter: batch =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.09, ease: "expo.out", overwrite: true }),
        });
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      });
    },
    { scope }
  );
};

export const Landing = () => {
  const root = useRef<HTMLDivElement>(null);
  useSmoothScroll();
  useScrollReveals(root);

  return (
    <div ref={root} className="relative bg-canvas text-ink">
      <LandingNav />
      <main>
        <Hero />
        <Story />
        <Screens />
        <Method />
      </main>
      <Closing />
    </div>
  );
};
