import { routes, tracesHref } from "@/lib/routes";
import type { NavItem } from "./navigation/nav-items";
import type { PaletteItem } from "./command-palette";

const DEMO_TRACE = "trace-8f21c9a4";
const DEMO_GATE = "gate-2026-1001-01";

/** Shortcuts into the reviewed approval-bypass story, available from every surface. */
const investigationItems: PaletteItem[] = [
  { id: "demo-trace", group: "Investigations", label: "Approval-bypass attempt", hint: DEMO_TRACE, href: routes.trace(DEMO_TRACE), keywords: "procurement purchase order block" },
  { id: "demo-rca", group: "Investigations", label: "Root cause for the approval bypass", hint: "Failure & RCA", href: routes.investigation(DEMO_TRACE), keywords: "rca cause" },
  { id: "demo-gate", group: "Investigations", label: "Retriever v2.4.0 release gate", hint: "BLOCK", href: routes.releaseGate(DEMO_GATE), keywords: "release candidate regression" },
  { id: "blocked", group: "Investigations", label: "All blocked traces", hint: "Trace Explorer", href: tracesHref({ decision: "BLOCK" }), keywords: "filter decision" },
];

export const landingPaletteItems: PaletteItem[] = [
  { id: "sec-how", group: "On this page", label: "How it works", href: "#how" },
  { id: "sec-screens", group: "On this page", label: "The seven screens", href: "#screens" },
  { id: "sec-method", group: "On this page", label: "Method", href: "#method" },
  { id: "go-overview", group: "Console", label: "Reliability Overview", hint: "01", href: routes.overview },
  { id: "go-applications", group: "Console", label: "Applications", hint: "02", href: routes.applications },
  { id: "go-traces", group: "Console", label: "Trace Explorer", hint: "03", href: routes.traces },
  { id: "go-gates", group: "Console", label: "Release Quality Gates", hint: "07", href: routes.releaseGates },
  ...investigationItems,
];

export const consolePaletteItems = (navItems: NavItem[]): PaletteItem[] => [
  ...navItems.flatMap(item =>
    item.href
      ? [{ id: `nav-${item.key}`, group: "Screens", label: item.label, hint: item.number, href: item.href }]
      : []
  ),
  ...investigationItems,
  { id: "home", group: "Other", label: "Back to the landing page", href: "/" },
];
