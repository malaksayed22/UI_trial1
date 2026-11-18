import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RcaNotAssessed } from "@/features/landing/rca-not-assessed";
import { Screens } from "@/features/landing/screens";
import { Story } from "@/features/landing/story";

// The story pins and animates with GSAP, which needs a real browser. The panels
// under test are plain markup, so the animation hooks are replaced with no-ops.
vi.mock("@/features/landing/motion", () => ({
  gsap: { utils: { selector: () => () => [] }, matchMedia: () => ({ add: () => undefined }) },
  useGSAP: () => undefined,
  PINNED_STORY: "(min-width: 1024px)",
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
