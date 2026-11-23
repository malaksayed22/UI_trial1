import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { pipelineSteps, rigorStats, TRACE_EVENT_COUNT } from "@/features/landing/data";
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

  it("uses the timeline length for the count shown in the hero replay footer", () => {
    expect(TRACE_EVENT_COUNT).toBe(traceDetails["trace-8f21c9a4"]!.events.length);
    render(<TraceReplay />);
    expect(screen.getByText(`${TRACE_EVENT_COUNT} events · 3 of 6 evaluators failed`)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/7 events/);
  });

  it("shows that caption in the story", () => {
    render(<Story />);
    expect(screen.getByText(/^Eight ordered events reconstructed/)).toBeInTheDocument();
  });
});
