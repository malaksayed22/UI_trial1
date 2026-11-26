import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GateVerdictPanel } from "@/features/release-gate/gate-verdict";
import { effectiveVerdict, verdictExplanation } from "@/features/release-gate/verdict";
import { RcaRanking } from "@/features/investigation/rca-ranking";
import { ReviewHistory } from "@/features/review/review-history";
import { investigations, gateRuns } from "@/mocks/fixtures";
import type { GateRun } from "@/types";

// Only the page-level tests below need a router; the page's navigation chrome calls these hooks.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/traces/trace-8f21c9a4/investigation",
  useSearchParams: () => new URLSearchParams(),
}));

const blockRun = gateRuns[0] as GateRun;

describe("RcaRanking", () => {
  // trace-d41f6b27 is a ranked-cause trace: agent_workflow 0.89, then prompt 0.67.
  const ranked = investigations["trace-d41f6b27"]!;
  const synthetic = investigations["trace-8f21c9a4"]!;
  const NOT_ASSESSED = "RCA not assessed for this synthetic boundary case";

  it("renders the API order and evidence scores without re-ranking", () => {
    render(<RcaRanking traceId={ranked.traceId} causes={ranked.rca} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText("Agent workflow")).toBeInTheDocument();
    expect(within(items[0]!).getByText("0.89")).toBeInTheDocument();
    expect(within(items[1]!).getByText("0.67")).toBeInTheDocument();
  });

  it("states that scores are evidence scores, not probabilities", () => {
    render(<RcaRanking traceId={ranked.traceId} causes={ranked.rca} />);
    expect(screen.getByText(/not calibrated probabilities/i)).toBeInTheDocument();
  });

  it("deep-links each cause to its supporting events", () => {
    render(<RcaRanking traceId={ranked.traceId} causes={ranked.rca} />);
    const links = screen.getAllByRole("link", { name: /^ev-\d+$/ });
    expect(links.length).toBeGreaterThan(0);
    links.forEach(link =>
      expect(link.getAttribute("href")).toMatch(/^\/traces\/trace-d41f6b27#event-ev-\d+$/)
    );
  });

  it("explains an empty ranking for a normal trace", () => {
    render(<RcaRanking traceId="trace-9a03e771" causes={[]} />);
    expect(screen.getByText(/no root causes are ranked/i)).toBeInTheDocument();
    expect(screen.queryByText(NOT_ASSESSED)).not.toBeInTheDocument();
  });

  describe("on the synthetic boundary case trace-8f21c9a4", () => {
    it("shows the not-assessed message instead of a ranking", () => {
      render(<RcaRanking traceId={synthetic.traceId} causes={synthetic.rca} />);
      expect(screen.getByText(NOT_ASSESSED)).toBeInTheDocument();
    });

    it("shows no ranked cause, score or empty-ranking wording", () => {
      const { container } = render(
        <RcaRanking traceId={synthetic.traceId} causes={synthetic.rca} />
      );
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
      expect(screen.queryByText("Agent workflow")).not.toBeInTheDocument();
      expect(screen.queryByText("Prompt")).not.toBeInTheDocument();
      expect(container.textContent).not.toMatch(/0\.91|0\.74|evidence score/);
      expect(container.textContent).not.toMatch(/no root causes are ranked|no failure was found/i);
      expect(container.textContent).not.toMatch(/calibrated probabilities/i);
    });

    it("tells 'not assessed' apart from 'no cause found'", () => {
      const { container: notAssessed } = render(
        <RcaRanking traceId={synthetic.traceId} causes={synthetic.rca} />
      );
      const assessedText = notAssessed.textContent;
      const { container: noneFound } = render(<RcaRanking traceId="trace-9a03e771" causes={[]} />);
      expect(assessedText).not.toBe(noneFound.textContent);
    });
  });
});

describe("release gate verdict", () => {
  it("shows an incomplete run as INCOMPLETE even if the payload says PASS", () => {
    const run: GateRun = { ...blockRun, status: "failed", verdict: "PASS" };
    expect(effectiveVerdict(run)).toBe("INCOMPLETE");
    render(<GateVerdictPanel run={run} />);
    expect(screen.getByText("INCOMPLETE")).toBeInTheDocument();
    expect(screen.queryByText("PASS")).not.toBeInTheDocument();
  });

  it("explains that BLOCK retains the baseline and triggers no rollback", () => {
    expect(verdictExplanation("BLOCK")).toMatch(/retains the current approved baseline/i);
    expect(verdictExplanation("BLOCK")).toMatch(/no rollback/i);
  });

  it("explains that REVIEW needs a human and is not an approval", () => {
    expect(verdictExplanation("REVIEW")).toMatch(/not an approval/i);
  });

  it("shows run provenance and the reasons behind the verdict", () => {
    render(<GateVerdictPanel run={blockRun} />);
    expect(screen.getByText(blockRun.runId)).toBeInTheDocument();
    expect(screen.getByText(/dataset-v1\.4\.0 · 1,200 traces/)).toBeInTheDocument();
    expect(screen.getByText(/groundedness regressed by 0\.12/i)).toBeInTheDocument();
  });
});

describe("ReviewHistory", () => {
  it("lists entries in the order provided, newest first", () => {
    render(<ReviewHistory entries={investigations["trace-8f21c9a4"]!.reviewHistory} />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]!).getByText("Priya K.")).toBeInTheDocument();
    expect(items).toHaveLength(3);
  });

  it("shows an empty state when there are no reviews", () => {
    render(<ReviewHistory entries={[]} />);
    expect(screen.getByText(/no human reviews/i)).toBeInTheDocument();
  });
});

describe("Failure & RCA page for the synthetic boundary case", () => {
  const renderPage = async (traceId: string) => {
    const { default: InvestigationPage } = await import(
      "@/app/(console)/traces/[traceId]/investigation/page"
    );
    render(await InvestigationPage({ params: Promise.resolve({ traceId }) }));
  };

  it("renders the not-assessed message and no ranked cause", async () => {
    await renderPage("trace-8f21c9a4");
    const panel = screen.getByRole("region", { name: /root-cause candidates/i });
    expect(within(panel).getByText("RCA not assessed for this synthetic boundary case")).toBeInTheDocument();
    expect(within(panel).queryByRole("listitem")).not.toBeInTheDocument();
    expect(panel.textContent).not.toMatch(/0\.91|0\.74|Agent workflow/);
  });

  it("still shows the ranked causes on another trace", async () => {
    await renderPage("trace-d41f6b27");
    const panel = screen.getByRole("region", { name: /root-cause candidates/i });
    expect(within(panel).getAllByRole("listitem")).toHaveLength(2);
    expect(within(panel).queryByText(/RCA not assessed/)).not.toBeInTheDocument();
  });
});
