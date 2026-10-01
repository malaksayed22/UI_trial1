"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, MOTION_REDUCED, ScrollTrigger } from "./motion";

const ANCHOR_OFFSET = -72;

/** Inertial scrolling synced to GSAP's ticker, with in-page anchors routed through Lenis. */
export const useSmoothScroll = () => {
  useEffect(() => {
    if (window.matchMedia(MOTION_REDUCED).matches) return;

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    const onTick = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = anchor?.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: ANCHOR_OFFSET, duration: 1.4 });
    };
    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);
};
