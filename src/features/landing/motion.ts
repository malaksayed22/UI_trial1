"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** Media queries shared by every landing animation so reduced motion is honoured in one place. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const MOTION_REDUCED = "(prefers-reduced-motion: reduce)";
export const PINNED_STORY = `(min-width: 1024px) and ${MOTION_OK}`;

export const EASE_OUT = "expo.out";
export const DURATION_REVEAL = 0.9;
