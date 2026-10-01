import {
  Boxes,
  FileSearch,
  GitBranch,
  LayoutDashboard,
  Radar,
  ShieldCheck,
  Split,
  type LucideIcon,
} from "lucide-react";
import type { FeaturedTraces } from "@/lib/featured-traces";
import { routes } from "@/lib/routes";

export type NavItem = {
  key: string;
  number: string;
  label: string;
  icon: LucideIcon;
  /** Null when the screen needs a trace that is not yet in context. */
  href: string | null;
  active: boolean;
};

const TRACE_PATH = /^\/traces\/([^/]+)/;

/** Extracts the trace the reviewer is currently investigating, if any. */
export const traceInContext = (pathname: string): string | null => {
  const match = TRACE_PATH.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

/**
 * The seven approved screens. Screens 04–06 are scoped to a trace: they stay
 * on the open trace, or open the latest flagged trace when none is selected.
 */
export const buildNavItems = (
  pathname: string,
  featured: FeaturedTraces = { detail: null, rag: null, investigation: null }
): NavItem[] => {
  const traceId = traceInContext(pathname);
  // With a trace open, stay on it; otherwise open the latest flagged trace.
  const scoped = (
    build: (id: string) => string,
    fallback: string | null
  ) => {
    const target = traceId ?? fallback;
    return target ? build(target) : null;
  };

  return [
    { key: "overview", number: "01", label: "Overview", icon: LayoutDashboard, href: routes.overview, active: pathname === routes.overview },
    { key: "applications", number: "02", label: "Applications", icon: Boxes, href: routes.applications, active: pathname.startsWith(routes.applications) },
    { key: "traces", number: "03", label: "Trace Explorer", icon: FileSearch, href: routes.traces, active: pathname === routes.traces },
    { key: "detail", number: "04", label: "Trace Detail", icon: GitBranch, href: scoped(routes.trace, featured.detail), active: traceId !== null && pathname === routes.trace(traceId) },
    { key: "rag", number: "05", label: "RAG Diagnostics", icon: Radar, href: scoped(routes.rag, featured.rag), active: traceId !== null && pathname === routes.rag(traceId) },
    { key: "investigation", number: "06", label: "Failure & RCA", icon: Split, href: scoped(routes.investigation, featured.investigation), active: traceId !== null && pathname === routes.investigation(traceId) },
    { key: "gate", number: "07", label: "Release Quality Gate", icon: ShieldCheck, href: routes.releaseGates, active: pathname.startsWith(routes.releaseGates) },
  ];
};
