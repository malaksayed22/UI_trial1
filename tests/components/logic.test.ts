import { describe, expect, it } from "vitest";
import { buildNavItems, traceInContext } from "@/components/navigation/nav-items";
import { visiblePages } from "@/components/ui/pagination";
import { presentEvent } from "@/features/trace-detail/event-presenter";
import { splitBySpans } from "@/features/rag/answer-segments";
import { activeFilterCount, parseTraceQuery, traceListHref } from "@/features/trace-explorer/query";
import { pickFeaturedTraces } from "@/lib/featured-traces";
import { traceDetails, traceSummaries } from "@/mocks/fixtures";

describe("trace explorer URL state", () => {
  it("parses valid filters and drops invalid ones", () => {
    const query = parseTraceQuery({
      q: "  8f21 ",
      application: "rag-assistant",
      decision: "MAYBE",
      from: "2026-10-01",
      to: "yesterday",
      page: "0",
    });
    expect(query).toMatchObject({ q: "8f21", application: "rag-assistant", from: "2026-10-01" });
    expect(query.decision).toBeUndefined();
    expect(query.to).toBeUndefined();
    expect(query.page).toBeUndefined();
  });

  it("rebuilds page links that keep every active filter", () => {
    const query = parseTraceQuery({ decision: "BLOCK", application: "procurement-agent" });
    expect(traceListHref(query, 1)).toBe("/traces?application=procurement-agent&decision=BLOCK");
    expect(traceListHref(query, 3)).toBe(
      "/traces?application=procurement-agent&decision=BLOCK&page=3"
    );
    expect(activeFilterCount(query)).toBe(2);
  });
});

describe("pagination window", () => {
  it("shows first, last and the neighbours with gaps", () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3]);
    expect(visiblePages(5, 42)).toEqual([1, "gap", 4, 5, 6, "gap", 42]);
  });
});

describe("event presentation", () => {
  const events = traceDetails["trace-8f21c9a4"]!.events;
  const labelOf = (id: string) =>
    presentEvent(events.find(event => event.eventId === id)!).label;

  it("separates a proposed tool call from its blocked result", () => {
    expect(labelOf("ev-5")).toBe("TOOL CALL · PROPOSED");
    expect(labelOf("ev-6")).toBe("TOOL RESULT · BLOCKED");
  });

  it("does not show missing token usage as zero", () => {
    const view = presentEvent(traceDetails["trace-6c41d9f2"]!.events[1]!);
    expect(view.facts).toContain("token usage unavailable");
    expect(view.facts.join(" ")).not.toMatch(/\b0 tokens\b/);
  });
});

describe("span splitting", () => {
  const text = "Limit is $4,200, and receipts are due in 30 days.";

  it("splits at exact offsets and keeps every character", () => {
    const claim = "receipts are due in 30 days";
    const start = text.indexOf(claim);
    const segments = splitBySpans(text, [
      { span: { start, end: start + claim.length }, value: "claim-1" },
    ]);
    expect(segments.filter(segment => segment.value)).toEqual([
      { text: claim, value: "claim-1" },
    ]);
    expect(segments.map(segment => segment.text).join("")).toBe(text);
  });

  it("does not search for text: an offset that points elsewhere highlights elsewhere", () => {
    const [, marked] = splitBySpans(text, [{ span: { start: 3, end: 8 }, value: "x" }]);
    expect(marked).toEqual({ text: text.slice(3, 8), value: "x" });
  });

  it("drops out-of-range, empty and overlapping spans instead of guessing", () => {
    const segments = splitBySpans("Plain answer", [
      { span: { start: 0, end: 99 }, value: "too long" },
      { span: { start: 4, end: 4 }, value: "empty" },
      { span: { start: -1, end: 3 }, value: "negative" },
    ]);
    expect(segments).toEqual([{ text: "Plain answer", value: null }]);

    const overlapping = splitBySpans("abcdefgh", [
      { span: { start: 0, end: 5 }, value: "first" },
      { span: { start: 3, end: 7 }, value: "second" },
    ]);
    expect(overlapping.filter(segment => segment.value).map(segment => segment.value)).toEqual([
      "first",
    ]);
  });
});

describe("navigation", () => {
  it("keeps trace-scoped screens unavailable until a trace is open", () => {
    const items = buildNavItems("/traces");
    expect(items).toHaveLength(7);
    expect(items.filter(item => item.href === null).map(item => item.number)).toEqual([
      "04",
      "05",
      "06",
    ]);
  });

  it("opens the latest flagged trace for screens 04–06 when none is selected", () => {
    const featured = pickFeaturedTraces(traceSummaries);
    expect(featured).toEqual({
      detail: "trace-8f21c9a4",
      rag: "trace-2f88b1e0",
      investigation: "trace-8f21c9a4",
    });
    const items = buildNavItems("/overview", featured);
    expect(items.map(item => item.href)).toEqual([
      "/overview",
      "/applications",
      "/traces",
      "/traces/trace-8f21c9a4",
      "/traces/trace-2f88b1e0/rag",
      "/traces/trace-8f21c9a4/investigation",
      "/release-gates",
    ]);
  });

  it("stays on the open trace instead of the featured one", () => {
    const featured = pickFeaturedTraces(traceSummaries);
    const items = buildNavItems("/traces/trace-6c41d9f2", featured);
    expect(items.find(item => item.number === "05")?.href).toBe(
      "/traces/trace-6c41d9f2/rag"
    );
  });

  it("links trace-scoped screens and marks the active one", () => {
    const items = buildNavItems("/traces/trace-8f21c9a4/investigation");
    expect(items.find(item => item.number === "06")).toMatchObject({
      href: "/traces/trace-8f21c9a4/investigation",
      active: true,
    });
    expect(items.find(item => item.number === "04")?.active).toBe(false);
    expect(traceInContext("/release-gates/gate-1")).toBeNull();
  });
});
