import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GateVerdictPanel } from "@/features/release-gate/gate-verdict";
import { effectiveVerdict, verdictExplanation } from "@/features/release-gate/verdict";
import { RcaRanking } from "@/features/investigation/rca-ranking";
import { ReviewHistory } from "@/features/review/review-history";
import { investigations, gateRuns } from "@/mocks/fixtures";
import type { GateRun } from "@/types";

const blockRun = gateRuns[0] as GateRun;

describe("RcaRanking", () => {
  const investigation = investigations["trace-8f21c9a4"]!;

  it("renders the API order and evidence scores without re-ranking", () => {
    render(<RcaRanking traceId={investigation.traceId} causes={investigation.rca} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]!).getByText("Agent workflow")).toBeInTheDocument();
    expect(within(items[0]!).getByText("0.91")).toBeInTheDocument();
    expect(within(items[2]!).getByText("0.52")).toBeInTheDocument();
  });

  it("states that scores are evidence scores, not probabilities", () => {
    render(<RcaRanking traceId={investigation.traceId} causes={investigation.rca} />);
    expect(screen.getByText(/not calibrated probabilities/i)).toBeInTheDocument();
  });

  it("deep-links each cause to its supporting events", () => {
    render(<RcaRanking traceId={investigation.traceId} causes={investigation.rca} />);
    const link = screen.getAllByRole("link", { name: "ev-5" })[0]!;
    expect(link).toHaveAttribute("href", "/traces/trace-8f21c9a4#event-ev-5");
  });

  it("explains an empty ranking for a normal trace", () => {
    render(<RcaRanking traceId="trace-9a03e771" causes={[]} />);
    expect(screen.getByText(/no root causes are ranked/i)).toBeInTheDocument();
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
