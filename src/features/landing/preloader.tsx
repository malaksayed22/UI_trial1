"use client";

import { useRef } from "react";
import { openIntroGate } from "./intro-gate";
import { gsap, MOTION_OK, MOTION_REDUCED, useGSAP } from "./motion";

const SEEN_KEY = "trustops:intro-seen";
const WORDS = ["Trace", "Evidence", "Decision"] as const;

const hasSeenIntro = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

const markIntroSeen = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Private mode: the intro simply replays on the next visit.
  }
};

/**
 * One-per-session intro: three words, a counter, then a curtain lift. Server-rendered
 * covering the page so there is no flash; a CSS failsafe removes it if JS never runs.
 */
export const Preloader = () => {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(MOTION_REDUCED, () => {
        gsap.set(el, { display: "none" });
        openIntroGate();
      });

      mm.add(MOTION_OK, () => {
        if (hasSeenIntro()) {
          gsap.set(el, { display: "none" });
          openIntroGate();
          return;
        }
        const q = gsap.utils.selector(el);
        const words = q("[data-word]");
        const counter = q("[data-count]")[0];
        const page = document.documentElement;
        const progress = { value: 0 };
        page.style.overflow = "hidden";

        gsap.set(words, { autoAlpha: 0, yPercent: 60, filter: "blur(10px)" });
        const tl = gsap.timeline({
          onComplete: () => {
            page.style.overflow = "";
            gsap.set(el, { display: "none" });
            markIntroSeen();
          },
        });

        tl.to(progress, {
          value: 100,
          duration: 2.1,
          ease: "power2.inOut",
          onUpdate: () => {
            if (counter) counter.textContent = String(Math.round(progress.value)).padStart(3, "0");
          },
        });
        words.forEach((word, index) => {
          const at = 0.1 + index * 0.65;
          tl.to(word, { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, at);
          if (index < words.length - 1) {
            tl.to(word, { autoAlpha: 0, yPercent: -40, filter: "blur(8px)", duration: 0.3, ease: "power2.in" }, at + 0.5);
          }
        });
        tl.to(q("[data-chrome]"), { autoAlpha: 0, duration: 0.3 }, 2.15)
          .call(openIntroGate, [], 2.35)
          .to(el, { yPercent: -100, duration: 1, ease: "expo.inOut" }, 2.3);

        return () => {
          page.style.overflow = "";
          tl.kill();
        };
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} aria-hidden className="preloader fixed inset-0 z-[100] flex items-center justify-center bg-canvas">
      <div
        data-chrome
        className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-6 font-mono text-[11px] uppercase tracking-[0.2em] text-faint sm:px-8"
      >
        <span>TrustOps</span>
        <span>Signal check</span>
      </div>
      <div className="relative h-[1.2em] w-full text-center text-[clamp(3rem,10vw,8rem)] font-medium leading-none tracking-[-0.045em]">
        {WORDS.map((word, index) => (
          <span
            key={word}
            data-word
            className={
              index === WORDS.length - 1
                ? "absolute inset-0 font-serif font-normal italic tracking-[-0.02em]"
                : "absolute inset-0"
            }
          >
            {word}
          </span>
        ))}
      </div>
      <div data-chrome className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 py-6 sm:px-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">Reconstructing execution</span>
        <span data-count className="font-mono text-5xl tabular-nums text-ink sm:text-7xl">
          000
        </span>
      </div>
    </div>
  );
};
