import { beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { VIEWER } from "@/mocks/fixtures";
import { queryTraces, resolveMock } from "@/mocks/handlers";
import { appendReview, listAppendedReviews, resetReviewStore } from "@/mocks/review-store";
import type { Investigation, Viewer } from "@/types";

describe("trace list contract", () => {
  it("returns newest first with a deterministic tie-break", () => {
    const { items } = queryTraces({});
    const starts = items.map(trace => trace.startedAt);
    expect(starts).toEqual([...starts].sort((a, b) => b.localeCompare(a)));
  });

  it("filters by application, decision and failure label together", () => {
    const { items, total } = queryTraces({
      application: "rag-assistant",
      decision: "REVIEW",
      failureLabel: "unsupported_claim",
    });
    expect(total).toBe(1);
    expect(items[0]?.traceId).toBe("trace-2f88b1e0");
  });

  it("filters by inclusive date range", () => {
    const { items } = queryTraces({ from: "2026-09-30", to: "2026-09-30" });
    expect(items.map(trace => trace.traceId).sort()).toEqual([
      "trace-06b7fa21",
      "trace-de08f31a",
    ]);
  });

  it("searches trace id, application, version and failure text", () => {
    expect(queryTraces({ q: "8f21" }).total).toBe(1);
    expect(queryTraces({ q: "retrieval failure" }).total).toBe(1);
    expect(queryTraces({ q: "app-v1.9.0" }).total).toBe(2);
    expect(queryTraces({ q: "no-such-trace" }).total).toBe(0);
  });

  it("paginates without loading everything and clamps out-of-range pages", () => {
    const first = queryTraces({ pageSize: 3, page: 1 });
    const last = queryTraces({ pageSize: 3, page: 99 });
    expect(first.items).toHaveLength(3);
    expect(first.total).toBe(7);
    expect(last.page).toBe(3);
    expect(last.items).toHaveLength(1);
  });

  it("exposes facets from the full dataset, not the filtered page", () => {
    const { facets } = queryTraces({ decision: "PASS" });
    expect(facets.versions.length).toBeGreaterThan(2);
    expect(facets.applications).toHaveLength(2);
  });
});

describe("api error model", () => {
  it("reports unknown traces as not_found", async () => {
    await expect(
      resolveMock({ method: "GET", path: "/traces/trace-unknown", query: {} })
    ).rejects.toMatchObject({ kind: "not_found" });
  });

  it("reports RAG diagnostics for a procurement trace as not_applicable", async () => {
    await expect(
      resolveMock({ method: "GET", path: "/traces/trace-8f21c9a4/rag", query: {} })
    ).rejects.toMatchObject({ kind: "not_applicable" });
  });

  it("treats summary-only traces as unavailable detail", async () => {
    await expect(
      resolveMock({ method: "GET", path: "/traces/trace-06b7fa21", query: {} })
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("human review (append-only)", () => {
  beforeEach(() => resetReviewStore());

  const target = { kind: "trace", traceId: "trace-8f21c9a4" } as const;
  const submission = {
    target,
    verdict: "BLOCK",
    rationale: "Approval evidence is missing from the trace.",
  } as const;

  it("rejects reviewers without permission, on the server side", () => {
    const engineer: Viewer = {
      ...VIEWER,
      role: "engineer",
      permissions: { canReview: false },
    };
    expect(() => appendReview(engineer, submission)).toThrowError(
      expect.objectContaining({ kind: "forbidden" })
    );
    expect(listAppendedReviews(target)).toHaveLength(0);
  });

  it("requires a meaningful rationale", () => {
    expect(() => appendReview(VIEWER, { ...submission, rationale: "ok" })).toThrowError(
      expect.objectContaining({ kind: "invalid" })
    );
  });

  it("appends entries newest first and never changes the machine decision", async () => {
    appendReview(VIEWER, submission, new Date("2026-10-01T12:00:00Z"));
    appendReview(VIEWER, { ...submission, verdict: "REVIEW" }, new Date("2026-10-01T12:05:00Z"));

    const investigation = (await resolveMock({
      method: "GET",
      path: "/traces/trace-8f21c9a4/investigation",
      query: {},
    })) as Investigation;

    expect(investigation.decision).toBe("BLOCK");
    expect(investigation.reviewHistory).toHaveLength(5);
    expect(investigation.reviewHistory[0]?.verdict).toBe("REVIEW");
    expect(investigation.reviewHistory[1]?.verdict).toBe("BLOCK");
  });
});
