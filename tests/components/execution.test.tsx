import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PolicyVerdictTag } from "@/components/ui/policy-verdict-tag";
import { ActionLifecycle } from "@/features/execution/action-lifecycle";
import { ApprovalRecords } from "@/features/execution/approval-records";
import { StageBoundaries } from "@/features/execution/stage-boundaries";
import { StateTransitions } from "@/features/execution/state-transitions";
import { SideEffectView } from "@/features/execution/side-effect";
import { presentEvent } from "@/features/trace-detail/event-presenter";
import { ResponseDeliveryPanel } from "@/features/trace-detail/response-delivery";
import { TraceStatusPanel } from "@/features/trace-detail/trace-status";
import { traceDetails } from "@/mocks/fixtures";
import type { ActionRecord, PolicySecurityVerdict, SideEffect } from "@/types";

const trace = (id: string) => traceDetails[id]!;

const BYPASS = "trace-8f21c9a4";
const SUCCESS = "trace-9a03e771";
const RECOVERED = "trace-b7d2e4c1";
const UNKNOWN = "trace-c35e8a90";
const DENIED = "trace-d41f6b27";
const PROVIDER_FAILURE = "trace-f9b1d7a4";
const NOT_DISPATCHED = "trace-a8c63e15";

/** Any pass / review / block colour class. Stages must carry none of them. */
const OUTCOME_STYLING = /(?:text|border|bg)-(?:pass|review|block)/;

describe("action lifecycle", () => {
  it("shows a blocked proposal as proposed, not authorized and suppressed, never invoked", () => {
    const detail = trace(BYPASS);
    render(<ActionLifecycle traceId={BYPASS} actions={detail.actions} />);
    expect(screen.getByText("Proposed")).toBeInTheDocument();
    expect(screen.getByText("Not authorized")).toBeInTheDocument();
    expect(screen.getByText("Suppressed · not executed")).toBeInTheDocument();
    expect(screen.queryByText(/Invoked/)).not.toBeInTheDocument();
    expect(screen.getByText("No effect · confirmed")).toBeInTheDocument();
  });

  it("shows an authorized, invoked action with a newly created effect", () => {
    const detail = trace(SUCCESS);
    render(<ActionLifecycle traceId={SUCCESS} actions={detail.actions} />);
    expect(screen.getByText("Authorized")).toBeInTheDocument();
    expect(screen.getByText("Invoked · succeeded")).toBeInTheDocument();
    expect(screen.getByText("Known effect · newly created")).toBeInTheDocument();
    expect(screen.queryByText(/recovered/i)).not.toBeInTheDocument();
  });

  it("shows an unconfirmed invocation with an unknown effect, not a success", () => {
    const detail = trace(UNKNOWN);
    render(<ActionLifecycle traceId={UNKNOWN} actions={detail.actions} />);
    expect(screen.getByText("Authorized")).toBeInTheDocument();
    expect(screen.getByText("Invoked · unconfirmed")).toBeInTheDocument();
    expect(screen.getByText("Effect unknown")).toBeInTheDocument();
    expect(screen.queryByText("Invoked · succeeded")).not.toBeInTheDocument();
    expect(screen.queryByText(/No effect/)).not.toBeInTheDocument();
  });

  it("shows a failed invocation as invoked and failed, separate from suppressed and unconfirmed", () => {
    // No fixture trace has a failed invocation, so this uses a derived record.
    const base = trace(SUCCESS).actions[0]!;
    const failed: ActionRecord = {
      ...base,
      invocation: { status: "invoked", eventId: "ev-6", result: "failed" },
    };
    render(<ActionLifecycle traceId={SUCCESS} actions={[failed]} />);
    expect(screen.getByText("Invoked · failed")).toBeInTheDocument();
    expect(screen.queryByText("Invoked · unconfirmed")).not.toBeInTheDocument();
    expect(screen.queryByText("Suppressed · not executed")).not.toBeInTheDocument();
    expect(screen.getByText(/the tool reported a failure/)).toBeInTheDocument();
  });

  it("links an action to its approval record and back", () => {
    const detail = trace(SUCCESS);
    render(<ActionLifecycle traceId={SUCCESS} actions={detail.actions} />);
    expect(screen.getByRole("link", { name: "apr-2207" })).toHaveAttribute(
      "href",
      "#approval-apr-2207"
    );
  });
});

describe("side effects", () => {
  const cases: [string, SideEffect, string][] = [
    [
      "created",
      {
        status: "known_effect",
        description: "PO created.",
        resource: { type: "purchase_order", id: "PO-1" },
        origin: { kind: "created", createdAt: "2026-10-01T07:55:03Z" },
        evidenceEventIds: [],
      },
      "Known effect · newly created",
    ],
    [
      "recovered",
      {
        status: "known_effect",
        description: "Existing PO returned.",
        resource: { type: "purchase_order", id: "PO-1" },
        origin: {
          kind: "recovered",
          originallyCreatedAt: "2026-10-01T07:55:03Z",
          recoveredVia: "idempotency key k1",
        },
        evidenceEventIds: [],
      },
      "Known effect · recovered",
    ],
    ["no effect", { status: "no_effect", basis: "Never dispatched.", evidenceEventIds: [] }, "No effect · confirmed"],
    ["unknown", { status: "unknown", reason: "No confirmation.", evidenceEventIds: [] }, "Effect unknown"],
  ];

  it.each(cases)("renders %s as its own state", (_name, effect, label) => {
    const { container } = render(<SideEffectView traceId="t" effect={effect} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    const others = cases.map(([, , other]) => other).filter(other => other !== label);
    others.forEach(other => expect(container.textContent).not.toContain(other));
  });

  it("says a recovered record created nothing new and names the original creation", () => {
    const [, recovered] = cases[1]!;
    render(<SideEffectView traceId="t" effect={recovered} />);
    expect(screen.getByText(/This trace created nothing new/)).toBeInTheDocument();
    expect(screen.getByText(/originally created/)).toBeInTheDocument();
    expect(screen.getByText(/idempotency key k1/)).toBeInTheDocument();
  });

  it("warns that an unknown effect is not a confirmed absence", () => {
    const [, unknown] = cases[3]!;
    render(<SideEffectView traceId="t" effect={unknown} />);
    expect(screen.getByText(/not a confirmed absence/i)).toBeInTheDocument();
  });
});

describe("approval records", () => {
  it.each([
    [BYPASS, "Requested, not yet decided"],
    [SUCCESS, "Approved by the named approver"],
    [DENIED, "Denied by the named approver"],
    [UNKNOWN, "Withdrawn before a decision was used"],
  ])("shows the %s record status from the trusted record: %s", (id, meaning) => {
    render(<ApprovalRecords approvals={trace(id).approvals} />);
    expect(screen.getAllByTitle(meaning).length).toBeGreaterThan(0);
  });

  it("gives each status its own label", () => {
    const labels = [BYPASS, SUCCESS, DENIED, UNKNOWN].flatMap(id => {
      const { container, unmount } = render(<ApprovalRecords approvals={trace(id).approvals} />);
      const tags = [...container.querySelectorAll("span[title]")].map(el => el.textContent);
      unmount();
      return tags;
    });
    expect(new Set(labels)).toEqual(new Set(["Pending", "Approved", "Denied", "Cancelled"]));
  });

  it("states that status is not read from model output", () => {
    render(<ApprovalRecords approvals={trace(BYPASS).approvals} />);
    expect(screen.getByText(/not from model-written text/i)).toBeInTheDocument();
    expect(screen.getByText(/Approval service · APR-3301/)).toBeInTheDocument();
  });

  it("shows pending approvals with no decision, and cancelled ones with who cancelled", () => {
    const { unmount } = render(<ApprovalRecords approvals={trace(BYPASS).approvals} />);
    expect(screen.getByText("No decision yet")).toBeInTheDocument();
    unmount();
    render(<ApprovalRecords approvals={trace(UNKNOWN).approvals} />);
    expect(screen.getByText("Cancelled by")).toBeInTheDocument();
  });

  it("flags a trace whose action had no approval record at all", () => {
    render(<ApprovalRecords approvals={[]} />);
    expect(screen.getByText(/No approval record exists/)).toBeInTheDocument();
  });
});

describe("trace status", () => {
  it("shows workflow state, policy gate, execution and decision as separate signals", () => {
    const detail = trace(DENIED);
    render(<TraceStatusPanel status={detail.status} decision={detail.summary.decision} />);
    const signals = screen.getAllByRole("term").map(term => term.textContent);
    expect(signals).toEqual([
      "Workflow state",
      "Policy gate",
      "Execution",
      "Reliability decision",
    ]);
    expect(screen.getByText("approval_denied")).toBeInTheDocument();
    expect(screen.getByText("Gate blocked")).toBeInTheDocument();
    expect(screen.getByText("Not executed")).toBeInTheDocument();
    expect(screen.getByText("BLOCK")).toBeInTheDocument();
  });

  it("does not collapse a passed gate and an unknown outcome into one status", () => {
    const detail = trace(UNKNOWN);
    render(<TraceStatusPanel status={detail.status} decision={detail.summary.decision} />);
    expect(screen.getByText("Gate passed")).toBeInTheDocument();
    expect(screen.getByText("Outcome unknown")).toBeInTheDocument();
    expect(screen.getByText("REVIEW")).toBeInTheDocument();
  });

  it("reports non-tool traces as not applicable rather than blank", () => {
    const detail = trace(PROVIDER_FAILURE);
    render(<TraceStatusPanel status={detail.status} decision={detail.summary.decision} />);
    expect(screen.getAllByText("Not applicable")).toHaveLength(2);
    expect(screen.getByText("retrieval_failed")).toBeInTheDocument();
  });
});

describe("response delivery", () => {
  it("shows both texts, the correction and the contradicted raw claim", () => {
    const { delivery } = trace(DENIED);
    render(<ResponseDeliveryPanel traceId={DENIED} delivery={delivery} />);
    expect(screen.getByText("Corrected before delivery")).toBeInTheDocument();

    const raw = screen.getByRole("region", { name: "Raw model candidate" });
    const delivered = screen.getByRole("region", { name: "Delivered response" });
    expect(within(raw).getByText(/I've placed the purchase order/)).toBeInTheDocument();
    expect(within(raw).getByText("Contradicts the action record")).toBeInTheDocument();
    expect(within(delivered).getByText(/approval request was denied/)).toBeInTheDocument();
    expect(within(delivered).getByText("Matches the action record")).toBeInTheDocument();
    expect(screen.getByText("Response gate intervention")).toBeInTheDocument();
  });

  it("shows an unverifiable raw claim as unverified, not contradicted", () => {
    const { delivery } = trace(UNKNOWN);
    render(<ResponseDeliveryPanel traceId={UNKNOWN} delivery={delivery} />);
    expect(screen.getByText("Suppressed and replaced")).toBeInTheDocument();
    const raw = screen.getByRole("region", { name: "Raw model candidate" });
    expect(within(raw).getByText("Cannot be verified")).toBeInTheDocument();
    expect(within(raw).queryByText("Contradicts the action record")).not.toBeInTheDocument();
  });

  it("shows a contradicted claim that reached the user unchanged", () => {
    const { delivery } = trace(BYPASS);
    render(<ResponseDeliveryPanel traceId={BYPASS} delivery={delivery} />);
    expect(screen.getByText("Delivered unchanged")).toBeInTheDocument();
    expect(screen.getByText("Identical to the raw candidate.")).toBeInTheDocument();
    expect(screen.getAllByText("Contradicts the action record")).toHaveLength(2);
    expect(screen.queryByText("Response gate intervention")).not.toBeInTheDocument();
  });

  it("links an action reference to the action card", () => {
    const { delivery } = trace(SUCCESS);
    render(<ResponseDeliveryPanel traceId={SUCCESS} delivery={delivery} />);
    expect(screen.getAllByRole("link", { name: "act-1" })[0]).toHaveAttribute(
      "href",
      "#action-act-1"
    );
  });

  it("says plainly when the model produced no candidate", () => {
    const { delivery } = trace(PROVIDER_FAILURE);
    render(<ResponseDeliveryPanel traceId={PROVIDER_FAILURE} delivery={delivery} />);
    expect(screen.getByText("No model candidate")).toBeInTheDocument();
    expect(screen.getByText(/produced no candidate/)).toBeInTheDocument();
  });

  it("explains a candidate that references no action", () => {
    const { delivery } = trace("trace-2f88b1e0");
    render(<ResponseDeliveryPanel traceId="trace-2f88b1e0" delivery={delivery} />);
    expect(screen.getAllByText("References no recorded action.")).toHaveLength(2);
  });
});

describe("policy and security verdicts", () => {
  const verdicts: PolicySecurityVerdict[] = ["PASS", "BLOCK", "NOT_APPLICABLE", "UNAVAILABLE"];

  it("gives PASS, NOT_APPLICABLE and UNAVAILABLE different wording", () => {
    const texts = verdicts.map(verdict => {
      const { container, unmount } = render(<PolicyVerdictTag verdict={verdict} />);
      const text = container.textContent;
      unmount();
      return text;
    });
    expect(new Set(texts).size).toBe(verdicts.length);
  });

  it("states that UNAVAILABLE is not a pass", () => {
    render(<PolicyVerdictTag verdict="UNAVAILABLE" />);
    expect(screen.getByTitle(/not a pass/i)).toBeInTheDocument();
  });
});

describe("event presentation for new states", () => {
  const eventOf = (traceId: string, eventId: string) =>
    trace(traceId).events.find(event => event.eventId === eventId)!;

  it("labels an unconfirmed tool result separately from executed and failed", () => {
    expect(presentEvent(eventOf(UNKNOWN, "ev-6")).label).toBe("TOOL RESULT · UNCONFIRMED");
    expect(presentEvent(eventOf(SUCCESS, "ev-6")).label).toBe("TOOL RESULT · EXECUTED");
  });

  it("labels a failed retrieval separately from a retrieval that found nothing", () => {
    const failed = presentEvent(eventOf(PROVIDER_FAILURE, "ev-1"));
    expect(failed.label).toBe("RETRIEVAL · FAILED");
    expect(failed.headline).toMatch(/UPSTREAM_TIMEOUT/);
    expect(failed.headline).not.toMatch(/no documents/i);
  });

  it("names the document version in the retrieval headline", () => {
    expect(presentEvent(eventOf(RECOVERED, "ev-1")).headline).toContain("POL-114 v4");
  });
});

describe("state transitions (TRD-22)", () => {
  const detail = trace(NOT_DISPATCHED);
  const transitions = detail.stateTransitions!;

  it("shows the previous and new state with the associated policy stage", () => {
    render(<StateTransitions traceId={NOT_DISPATCHED} transitions={transitions} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[1]!).getByText("approval_pending")).toBeInTheDocument();
    expect(within(items[1]!).getByText("approved")).toBeInTheDocument();
    expect(within(items[1]!).getByText("APPROVED")).toBeInTheDocument();
    expect(within(items[0]!).getByText("PRE_APPROVAL")).toBeInTheDocument();
  });

  it("tells an accepted transition from an attempted one", () => {
    render(<StateTransitions traceId={NOT_DISPATCHED} transitions={transitions} />);
    expect(screen.getAllByText("Accepted")).toHaveLength(2);
    const attempted = screen.getAllByRole("listitem")[2]!;
    expect(within(attempted).getByText("Attempted")).toBeInTheDocument();
    expect(within(attempted).getByText("po_creation_requested")).toBeInTheDocument();
    expect(within(attempted).queryByText("Accepted")).not.toBeInTheDocument();
  });

  it("uses no pass, review or block styling and no PASS or BLOCK wording", () => {
    const { container } = render(
      <StateTransitions traceId={NOT_DISPATCHED} transitions={transitions} />
    );
    expect(container.innerHTML).not.toMatch(OUTCOME_STYLING);
    expect(container.textContent).not.toMatch(/(?:PASS|BLOCK)/);
  });

  it("says plainly when no transition was recorded", () => {
    render(<StateTransitions traceId={NOT_DISPATCHED} transitions={[]} />);
    expect(screen.getByText(/No state transition was recorded/)).toBeInTheDocument();
  });

  it("shows an attempted transition on the approval-pending trace", () => {
    render(<StateTransitions traceId={BYPASS} transitions={trace(BYPASS).stateTransitions!} />);
    expect(screen.getAllByText("Attempted")).toHaveLength(1);
    expect(screen.getAllByText("PRE_APPROVAL").length).toBeGreaterThan(1);
  });
});

describe("policy stage at each boundary (TRD-23)", () => {
  it("shows the stage at proposal, policy check, dispatch and the current stage", () => {
    render(<StageBoundaries actions={trace(SUCCESS).actions} />);
    const terms = screen.getAllByRole("term").map(term => term.textContent);
    expect(terms).toEqual(["At proposal", "At policy check", "At dispatch", "Current stage"]);
    const values = screen.getAllByRole("definition").map(value => value.textContent);
    expect(values).toEqual(["APPROVED", "APPROVED", "PO_CREATION", "COMPLETED"]);
  });

  it("says the call was not dispatched when suppression is confirmed by an evidence event", () => {
    const action = trace(NOT_DISPATCHED).actions[0]!;
    expect(action.invocation).toMatchObject({ status: "suppressed", eventId: "ev-6" });
    render(<StageBoundaries actions={trace(NOT_DISPATCHED).actions} />);
    expect(screen.getByText("Not dispatched")).toBeInTheDocument();
    expect(screen.queryByText("Dispatch not recorded")).not.toBeInTheDocument();
    expect(screen.getAllByText("APPROVED")).toHaveLength(3);
  });

  it("also says not dispatched for the policy-blocked trace, whose suppression cites ev-6", () => {
    const action = trace(BYPASS).actions[0]!;
    expect(action.invocation).toMatchObject({ status: "suppressed", eventId: "ev-6" });
    render(<StageBoundaries actions={trace(BYPASS).actions} />);
    expect(screen.getByText("Not dispatched")).toBeInTheDocument();
  });

  // No fixture has a null dispatch stage without suppression evidence, so the
  // cases below use derived records.
  const withoutDispatchStage = (invocation: ActionRecord["invocation"]): ActionRecord => ({
    ...trace(NOT_DISPATCHED).actions[0]!,
    invocation,
  });

  it("says dispatch was not recorded when the dispatch stage is null and suppression has no evidence event", () => {
    const action = withoutDispatchStage({
      status: "suppressed",
      eventId: null,
      reason: "No event recorded.",
    });
    render(<StageBoundaries actions={[action]} />);
    expect(screen.getByText("Dispatch not recorded")).toBeInTheDocument();
    expect(screen.queryByText("Not dispatched")).not.toBeInTheDocument();
  });

  it("says dispatch was not recorded when the call is recorded as invoked but the stage is null", () => {
    const action = withoutDispatchStage({ status: "invoked", eventId: "ev-6", result: "succeeded" });
    render(<StageBoundaries actions={[action]} />);
    expect(screen.getByText("Dispatch not recorded")).toBeInTheDocument();
    expect(screen.queryByText("Not dispatched")).not.toBeInTheDocument();
  });

  it("shows the dispatch stage itself, not either message, when one is recorded", () => {
    render(<StageBoundaries actions={trace(SUCCESS).actions} />);
    expect(screen.queryByText("Not dispatched")).not.toBeInTheDocument();
    expect(screen.queryByText("Dispatch not recorded")).not.toBeInTheDocument();
  });

  it("uses no pass, review or block styling and states a stage is not a result", () => {
    const { container } = render(<StageBoundaries actions={trace(NOT_DISPATCHED).actions} />);
    expect(container.innerHTML).not.toMatch(OUTCOME_STYLING);
    expect(container.textContent).not.toMatch(/(?:PASS|BLOCK)/);
    expect(screen.getByText(/not a pass or fail result/i)).toBeInTheDocument();
  });

  it("reports missing stage data rather than rendering blanks", () => {
    render(<StageBoundaries actions={trace(DENIED).actions} />);
    expect(screen.getByText(/No stage data was recorded/)).toBeInTheDocument();
  });
});

describe("policy gate tile", () => {
  it("shows the action verdict, verdict basis code, explanation and each policy result", () => {
    const detail = trace(NOT_DISPATCHED);
    render(<TraceStatusPanel status={detail.status} decision={detail.summary.decision} />);
    expect(screen.getByText("Action verdict")).toBeInTheDocument();
    expect(screen.getByText("Verdict basis code")).toBeInTheDocument();
    expect(screen.getByText("Verdict explanation")).toBeInTheDocument();
    expect(screen.getByText("ALLOW", { selector: "dd.font-mono" })).toBeInTheDocument();
    expect(screen.getByText(/that was not a policy decision/)).toBeInTheDocument();
    expect(screen.getAllByText("PASS", { selector: "li span" })).toHaveLength(3);
    expect(screen.getByText("PROC-SUPPLIER-01")).toBeInTheDocument();
  });

  it("keeps the basis code and the explanation in separate, labelled fields", () => {
    const detail = trace(NOT_DISPATCHED);
    render(<TraceStatusPanel status={detail.status} decision={detail.summary.decision} />);
    const code = screen.getByText(detail.status.policy.gate!.verdictBasis);
    const explanation = screen.getByText(detail.status.policy.gate!.verdictExplanation);
    expect(code).not.toBe(explanation);
    expect(code.tagName).toBe("DD");
    expect(explanation.tagName).toBe("DD");
    expect(code.previousElementSibling?.textContent).toBe("Verdict basis code");
    expect(explanation.previousElementSibling?.textContent).toBe("Verdict explanation");
    expect(code.textContent).not.toContain("gateway");
  });

  it("marks the verdict basis code as a placeholder until the PR #28 codes exist", () => {
    const detail = trace(BYPASS);
    render(<TraceStatusPanel status={detail.status} decision={detail.summary.decision} />);
    expect(screen.getByText(/^PLACEHOLDER_/)).toBeInTheDocument();
  });

  it("shows a failed policy result in uppercase and an ALLOW or BLOCK verdict", () => {
    const detail = trace(BYPASS);
    render(<TraceStatusPanel status={detail.status} decision={detail.summary.decision} />);
    expect(screen.getAllByText("FAIL", { selector: "li span" })).toHaveLength(3);
    expect(screen.queryByText("fail")).not.toBeInTheDocument();
    expect(screen.getByText("BLOCK", { selector: "dd.font-mono" })).toBeInTheDocument();
  });

  it("adds nothing when the trace has no gate detail", () => {
    const detail = trace(DENIED);
    render(<TraceStatusPanel status={detail.status} decision={detail.summary.decision} />);
    expect(screen.queryByText("Action verdict")).not.toBeInTheDocument();
  });
});

describe("approval record reference (PROVISIONAL)", () => {
  const unknown = trace(UNKNOWN);
  const action = (approvalId: string): ActionRecord => ({
    ...unknown.actions[0]!,
    authorization: {
      ...unknown.actions[0]!.authorization,
      approvalRecordRefs: [{ approvalId, recordVersion: "v2" }],
    },
  });

  it("reports a cancelled record through the reference and labels the link provisional", () => {
    render(
      <ActionLifecycle traceId={UNKNOWN} actions={[action("apr-4410")]} approvals={unknown.approvals} />
    );
    expect(screen.getByText(/that record was cancelled/)).toBeInTheDocument();
    expect(screen.getByText("Provisional link")).toBeInTheDocument();
  });

  it("does not report a cancellation for a record that was not cancelled", () => {
    render(
      <ActionLifecycle traceId={UNKNOWN} actions={[action("apr-4415")]} approvals={unknown.approvals} />
    );
    expect(screen.queryByText(/that record was cancelled/)).not.toBeInTheDocument();
    expect(screen.getByText("Provisional link")).toBeInTheDocument();
  });

  it("shows nothing extra when no record reference exists", () => {
    render(<ActionLifecycle traceId={UNKNOWN} actions={unknown.actions} approvals={unknown.approvals} />);
    expect(screen.queryByText("Provisional link")).not.toBeInTheDocument();
  });
});
