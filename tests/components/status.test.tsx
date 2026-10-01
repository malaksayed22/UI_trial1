import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { MeasurementValue } from "@/components/ui/measurement-value";
import { formatDelta, formatScore } from "@/lib/format";
import type { GateVerdict, Measurement } from "@/types";

describe("DecisionBadge", () => {
  it.each<GateVerdict>(["PASS", "REVIEW", "BLOCK", "INCOMPLETE"])(
    "shows %s as visible text, not colour alone",
    decision => {
      render(<DecisionBadge decision={decision} />);
      expect(screen.getByText(decision)).toBeVisible();
    }
  );

  it("explains that REVIEW is not an approval", () => {
    render(<DecisionBadge decision="REVIEW" />);
    expect(screen.getByTitle(/not an approval/i)).toBeInTheDocument();
  });

  it("states that an incomplete evaluation is never a PASS", () => {
    render(<DecisionBadge decision="INCOMPLETE" />);
    expect(screen.getByTitle(/never treated as PASS/i)).toBeInTheDocument();
  });
});

describe("MeasurementValue", () => {
  it("renders a genuine zero score as 0.00", () => {
    const zero: Measurement = {
      status: "scored",
      value: 0,
      direction: "higher_is_better",
      range: [0, 1],
    };
    render(<MeasurementValue measurement={zero} />);
    expect(screen.getByText("0.00")).toBeInTheDocument();
  });

  it("shows direction and range for scored values when asked", () => {
    render(
      <MeasurementValue
        showDirection
        measurement={{
          status: "scored",
          value: 0.88,
          direction: "lower_is_better",
          range: [0, 1],
        }}
      />
    );
    expect(screen.getByText(/lower is better/)).toBeInTheDocument();
  });

  it("never renders missing results as zero", () => {
    const cases: Measurement[] = [
      { status: "not_evaluated" },
      { status: "evaluator_failed", reason: "Judge request timed out." },
      { status: "not_applicable", reason: "Non-RAG trace." },
    ];
    cases.forEach(measurement => {
      const { container, unmount } = render(<MeasurementValue measurement={measurement} />);
      expect(container.textContent).not.toMatch(/0\.00/);
      unmount();
    });
  });

  it("keeps the three non-scored states distinct", () => {
    render(
      <>
        <MeasurementValue measurement={{ status: "not_evaluated" }} />
        <MeasurementValue measurement={{ status: "evaluator_failed", reason: "Timed out" }} />
        <MeasurementValue measurement={{ status: "not_applicable", reason: "Non-RAG" }} />
      </>
    );
    expect(screen.getByText("Not evaluated")).toBeInTheDocument();
    expect(screen.getByText("Evaluator failed")).toBeInTheDocument();
    expect(screen.getByText("Not applicable")).toBeInTheDocument();
    expect(screen.getByText(/Timed out/)).toBeInTheDocument();
  });
});

describe("number formatting", () => {
  it("formats scores to two decimals", () => {
    expect(formatScore(0.9)).toBe("0.90");
  });

  it("signs deltas with a true minus and no sign for zero", () => {
    expect(formatDelta(-0.12)).toBe("−0.12");
    expect(formatDelta(0.05)).toBe("+0.05");
    expect(formatDelta(0)).toBe("0.00");
  });
});
