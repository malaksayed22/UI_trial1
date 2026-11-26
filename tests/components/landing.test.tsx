import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { pipelineSteps, rigorStats, TRACE_EVENT_COUNT, traceSpans } from "@/features/landing/data";
import { Hero } from "@/features/landing/hero";
import { Method } from "@/features/landing/method";
import { RcaNotAssessed } from "@/features/landing/rca-not-assessed";
import { Screens } from "@/features/landing/screens";
import { Story } from "@/features/landing/story";
import { TraceReplay } from "@/features/landing/trace-replay";
import { traceDetails } from "@/mocks/fixtures";

// The story pins and animates with GSAP, which needs a real browser. The panels
// under test are plain markup, so the animation hooks are replaced with no-ops.
vi.mock("@/features/landing/motion", () => ({
  gsap: { utils: { selector: () => () => [] }, matchMedia: () => ({ add: () => undefined }) },
  useGSAP: () => undefined,
  PINNED_STORY: "(min-width: 1024px)",
  MOTION_OK: "(prefers-reduced-motion: no-preference)",
  MOTION_REDUCED: "(prefers-reduced-motion: reduce)",
  ScrollTrigger: {},
  SplitText: {},
}));

// Lets tests shorten traceSpans and change TRACE_EVENT_COUNT to prove the footer follows both.
const spanLimit = vi.hoisted(() => ({ value: null as number | null, total: null as number | null }));
vi.mock("@/features/landing/data", async importOriginal => {
  const actual = await importOriginal<typeof import("@/features/landing/data")>();
  const mocked = Object.defineProperty({ ...actual }, "traceSpans", {
    enumerable: true,
    get: () => (spanLimit.value === null ? actual.traceSpans : actual.traceSpans.slice(0, spanLimit.value)),
  });
  return Object.defineProperty(mocked, "TRACE_EVENT_COUNT", {
    enumerable: true,
    get: () => spanLimit.total ?? actual.TRACE_EVENT_COUNT,
  });
});

const NOT_ASSESSED = "RCA not assessed for this synthetic boundary case";
const OLD_CAUSE_PATTERN = /0\.91|0\.74|0\.52|agent_workflow|policy_configuration/;

describe("landing RCA preview for trace-8f21c9a4", () => {
  it("shows the not-assessed message and no ranked cause or score", () => {
    render(<RcaNotAssessed />);
    expect(screen.getByText(NOT_ASSESSED)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(OLD_CAUSE_PATTERN);
  });

  it("shows the message, not the old causes, in the Failure & RCA screen card", () => {
    render(<Screens />);
    const card = screen.getByText(NOT_ASSESSED).closest("[data-reveal]");
    expect(card).not.toBeNull();
    expect(card?.textContent).toMatch(/Failure & RCA/);
    expect(card?.textContent).not.toMatch(OLD_CAUSE_PATTERN);
    expect(card?.textContent).not.toMatch(/\bprompt\b/);
  });

  it("shows the message, not the old causes, in the story's root-cause panel", () => {
    render(<Story />);
    const panel = screen.getByText(NOT_ASSESSED).closest("[data-panel]");
    expect(panel).not.toBeNull();
    expect(panel?.textContent).not.toMatch(OLD_CAUSE_PATTERN);
    expect(panel?.textContent).not.toMatch(/\bprompt\b/);
  });
});

const RCA_SUMMARY = "Root-cause candidates and supporting events when assessed.";
const OLD_RANKING_WORDING = /3 ranked root causes|ranked root causes|ranked top[-‑]?3/i;
const NUMBER_WORDS: Record<string, number> = {
  Six: 6, Seven: 7, Eight: 8, Nine: 9, Ten: 10, Eleven: 11, Twelve: 12,
};

describe("landing copy for the Failure & RCA card and the root-cause step", () => {
  it("describes the Failure & RCA card as candidates when assessed", () => {
    render(<Screens />);
    const card = screen.getByText(NOT_ASSESSED).closest("[data-reveal]");
    expect(card?.textContent).toContain(RCA_SUMMARY);
  });

  it("uses the same summary for the root-cause step in the story", () => {
    const cause = pipelineSteps.find(step => step.key === "cause");
    expect(cause?.summary).toBe(RCA_SUMMARY);
    render(<Story />);
    expect(screen.getByText(RCA_SUMMARY)).toBeInTheDocument();
  });

  it("does not bring back the old ranked top-3 or '3 ranked root causes' wording", () => {
    render(
      <>
        <Screens />
        <Story />
        <Method />
      </>
    );
    expect(document.body.textContent).not.toMatch(OLD_RANKING_WORDING);
    expect(JSON.stringify(pipelineSteps)).not.toMatch(OLD_RANKING_WORDING);
    expect(JSON.stringify(rigorStats)).not.toMatch(OLD_RANKING_WORDING);
  });
});

describe("landing statistics", () => {
  it("states the RCA statistic as a capability, not as a count of ranked causes", () => {
    render(<Method />);
    const stats = document.querySelector("dl")!;
    expect(within(stats).getByText("Up to 3 RCA candidates when assessed")).toBeInTheDocument();
  });

  it("shows 'Illustrative fixture data' as visible text directly above the statistics", () => {
    render(<Method />);
    const label = screen.getByText("Illustrative fixture data");
    expect(label.nextElementSibling?.tagName).toBe("DL");
    expect(label.closest("[aria-hidden='true'], [hidden]")).toBeNull();
    expect(label.className).not.toMatch(/sr-only|hidden/);
  });
});

describe("landing trace event count", () => {
  it("says the same number of ordered events as the trace-8f21c9a4 timeline", () => {
    const caption = pipelineSteps.find(step => step.key === "trace")!.caption;
    const word = /^(\w+) ordered events/.exec(caption)?.[1];
    expect(word, caption).toBeDefined();
    expect(NUMBER_WORDS[word!], `unknown number word "${word}"`).toBe(
      traceDetails["trace-8f21c9a4"]!.events.length
    );
  });

  it("shows that caption in the story", () => {
    render(<Story />);
    expect(screen.getByText(/^Eight ordered events reconstructed/)).toBeInTheDocument();
  });
});

describe("landing hero paragraph", () => {
  const paragraph = () => {
    render(<Hero />);
    return screen.getByText(/reconstructs the hidden execution path/).textContent ?? "";
  };

  it("says the product shows root-cause candidates when assessed", () => {
    expect(paragraph()).toContain("shows root-cause candidates when assessed");
  });

  it("does not say the product ranks the root cause", () => {
    expect(paragraph()).not.toMatch(/ranks (the )?root cause/i);
  });

  it("keeps the rest of the sentence", () => {
    expect(paragraph().replace(/\s+/g, " ")).toBe(
      "TrustOps reconstructs the hidden execution path behind every response, scores it with evidence, shows root-cause candidates when assessed, and resolves each release to a decision your team can defend."
    );
  });
});

describe("hero replay footer", () => {
  const eventsText = () => document.querySelector("[data-footer-events]")?.textContent;

  it("reads exactly '8 total events · 6 shown', with a middle dot between spaces", () => {
    render(<TraceReplay />);
    expect(eventsText()).toBe("8 total events · 6 shown");
    expect(eventsText()).toContain(" · ");
    expect(screen.getByText("8 total events · 6 shown")).toBeInTheDocument();
  });

  it("takes the total from TRACE_EVENT_COUNT and the trace-8f21c9a4 timeline length", () => {
    render(<TraceReplay />);
    expect(TRACE_EVENT_COUNT).toBe(traceDetails["trace-8f21c9a4"]!.events.length);
    expect(eventsText()).toMatch(new RegExp(`^${TRACE_EVENT_COUNT} total events`));
  });

  it("makes the total follow TRACE_EVENT_COUNT, not a fixed number", () => {
    spanLimit.total = 9;
    try {
      render(<TraceReplay />);
      expect(eventsText()).toBe(`9 total events · ${traceSpans.length} shown`);
    } finally {
      spanLimit.total = null;
    }
  });

  it("takes the shown count from traceSpans.length", () => {
    render(<TraceReplay />);
    expect(eventsText()).toMatch(new RegExp(` ${traceSpans.length} shown$`));
  });

  it("makes the shown count follow the traceSpans array, not a fixed number", () => {
    spanLimit.value = 4;
    try {
      render(<TraceReplay />);
      expect(eventsText()).toBe(`${TRACE_EVENT_COUNT} total events · 4 shown`);
    } finally {
      spanLimit.value = null;
    }
  });

  it("keeps the evaluator summary as its own element, with its wording unchanged", () => {
    render(<TraceReplay />);
    const events = document.querySelector("[data-footer-events]")!;
    const evaluators = document.querySelector("[data-footer-evaluators]");
    expect(evaluators?.textContent).toBe("3 of 6 evaluators failed");
    expect(evaluators).not.toBe(events);
    expect(events.contains(evaluators)).toBe(false);
    expect(evaluators?.contains(events)).toBe(false);
    expect(events.textContent).not.toMatch(/evaluator/);
  });

  it("no longer shows the old '8 events' footer", () => {
    render(<TraceReplay />);
    expect(document.body.textContent).not.toMatch(/\b8 events/);
    expect(document.body.textContent).not.toMatch(/\b7 events/);
  });
});
