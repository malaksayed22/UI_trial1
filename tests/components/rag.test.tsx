import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClaimExplorer } from "@/features/rag/claim-explorer";
import { resolveEvidenceTrail, initialClaimId } from "@/features/rag/evidence-trail";
import { QueryAndAnswer } from "@/features/rag/query-and-answer";
import { RetrievalTable } from "@/features/rag/retrieval-table";
import { ragDiagnostics } from "@/mocks/fixtures";
import type { RagDiagnostics } from "@/types";

const UNSUPPORTED = "trace-2f88b1e0";
const CITED_NO_SUPPORT = "trace-6c41d9f2";
const ABSTAINED = "trace-e5a7c302";
const PROVIDER_FAILURE = "trace-f9b1d7a4";

const diagnostics = (id: string): RagDiagnostics => ragDiagnostics[id]!;

const renderExplorer = (id: string) => {
  const d = diagnostics(id);
  return render(
    <ClaimExplorer
      answer={d.answer!}
      claims={d.claims}
      sources={d.sources}
      documents={d.documents}
    />
  );
};

describe("evidence trail resolution", () => {
  const d = diagnostics(UNSUPPORTED);

  it("follows a supported claim to source, version, passage and span", () => {
    const trail = resolveEvidenceTrail(d.claims[0]!, d.sources, d.documents);
    expect(trail.state).toBe("supported");
    expect(trail.source).toMatchObject({
      sourceId: "HR-221",
      citedVersion: "v6",
      retrieval: { rank: 1, retrievedVersion: "v6", versionMatches: true },
    });
    expect(trail.passage?.passageId).toBe("p-4.2-1");
    const { start, end } = trail.sourceSpan!;
    expect(trail.passage!.text.slice(start, end)).toMatch(/^up to \$4,200/);
  });

  it("reports an uncited claim as having no source, passage or span", () => {
    const trail = resolveEvidenceTrail(d.claims[2]!, d.sources, d.documents);
    expect(trail).toMatchObject({ state: "uncited", source: null, passage: null, sourceSpan: null });
  });

  it("separates a cited-but-unsupported claim from an uncited one", () => {
    const cited = diagnostics(CITED_NO_SUPPORT);
    const trail = resolveEvidenceTrail(cited.claims[0]!, cited.sources, cited.documents);
    expect(trail.state).toBe("cited_without_support");
    expect(trail.passage).not.toBeNull();
    expect(trail.sourceSpan).toBeNull();
  });

  it("flags a cited version that differs from the retrieved version", () => {
    const claim = {
      ...d.claims[0]!,
      citation: { ...d.claims[0]!.citation!, documentVersion: "v5" },
    };
    const sources = [{ ...d.sources[0]!, version: "v5" }];
    const trail = resolveEvidenceTrail(claim, sources, d.documents);
    expect(trail.source?.retrieval).toMatchObject({ retrievedVersion: "v6", versionMatches: false });
  });

  it("reports a citation whose source text was not delivered", () => {
    const trail = resolveEvidenceTrail(d.claims[0]!, [], d.documents);
    expect(trail.state).toBe("source_unavailable");
    expect(trail.passage).toBeNull();
  });

  it("opens on the first unsupported claim", () => {
    expect(initialClaimId(d.claims)).toBe("claim-3");
    expect(initialClaimId([])).toBeNull();
  });
});

describe("claim explorer", () => {
  it("opens on the unsupported claim and says there is no source", () => {
    renderExplorer(UNSUPPORTED);
    const trail = screen.getByRole("region", { name: "Evidence trail" });
    expect(within(trail).getByText(/receipts must be filed within 30 days/)).toBeInTheDocument();
    expect(within(trail).getByText("No source was cited for this claim.")).toBeInTheDocument();
    expect(within(trail).getByText(/no receipt-filing deadline|receipt-filing deadline/)).toBeInTheDocument();
    expect(within(trail).queryByText("HR-221")).not.toBeInTheDocument();
  });

  it("navigates from an answer claim to its source, version, passage and highlighted span", () => {
    renderExplorer(UNSUPPORTED);
    // The first match is the claim inside the answer text; the second is its row in the list.
    fireEvent.click(screen.getAllByRole("button", { name: /Any excess requires VP sign-off/ })[0]!);

    const trail = screen.getByRole("region", { name: "Evidence trail" });
    expect(within(trail).getByText("HR-221")).toBeInTheDocument();
    expect(within(trail).getByText("v6")).toBeInTheDocument();
    expect(within(trail).getByText("§4.2 ¶2")).toBeInTheDocument();
    expect(within(trail).getByText(/Retrieved at rank #1/)).toBeInTheDocument();

    const marked = trail.querySelector("mark");
    expect(marked?.textContent).toContain("require written sign-off from a Vice President");
    expect(within(trail).getByText(/Passage characters/)).toBeInTheDocument();
  });

  it("navigates from the claims list as well as from the answer text", () => {
    renderExplorer(UNSUPPORTED);
    const list = screen.getByRole("list", { name: "Claims" });
    fireEvent.click(within(list).getAllByRole("button")[0]!);
    expect(
      within(screen.getByRole("region", { name: "Evidence trail" })).getByText("§4.2 ¶1")
    ).toBeInTheDocument();
    expect(within(list).getAllByRole("button")[0]).toHaveAttribute("aria-pressed", "true");
    expect(within(list).getAllByRole("button")[2]).toHaveAttribute("aria-pressed", "false");
  });

  it("marks supported and unsupported claims in the answer without relying on colour", () => {
    renderExplorer(UNSUPPORTED);
    expect(screen.getAllByText("(supported claim)", { exact: false })).toHaveLength(2);
    expect(screen.getAllByText("(unsupported claim)", { exact: false })).toHaveLength(1);
  });

  it("says a cited passage contains nothing that supports the claim", () => {
    renderExplorer(CITED_NO_SUPPORT);
    const trail = screen.getByRole("region", { name: "Evidence trail" });
    expect(within(trail).getByText("FIN-014")).toBeInTheDocument();
    expect(within(trail).getByText(/contains nothing that supports this claim/)).toBeInTheDocument();
    expect(trail.querySelector("mark")).toBeNull();
  });
});

describe("abstention versus technical failure", () => {
  it("presents an abstention as a deliberate decision, not a fault", () => {
    render(<QueryAndAnswer diagnostics={diagnostics(ABSTAINED)} />);
    expect(screen.getByText("Abstained")).toBeInTheDocument();
    expect(screen.getByText("Abstained on purpose")).toBeInTheDocument();
    expect(screen.getByText(/not a retrieval or provider failure/i)).toBeInTheDocument();
    expect(screen.queryByText(/Technical failure/)).not.toBeInTheDocument();
    expect(screen.getByText(/I could not find a policy/)).toBeInTheDocument();
  });

  it("presents a provider fault with its stage, provider, code and retry guidance", () => {
    render(<QueryAndAnswer diagnostics={diagnostics(PROVIDER_FAILURE)} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Technical failure at the retrieval stage");
    expect(screen.getByText("pgvector-prod")).toBeInTheDocument();
    expect(screen.getByText("UPSTREAM_TIMEOUT")).toBeInTheDocument();
    expect(screen.getByText("Safe to retry")).toBeInTheDocument();
    expect(screen.getByText(/not an abstention/i)).toBeInTheDocument();
    expect(screen.queryByText("Abstained on purpose")).not.toBeInTheDocument();
    expect(screen.getByText(/produced no answer/)).toBeInTheDocument();
  });

  it("tells an empty retrieval from a failed one", () => {
    const d = diagnostics(PROVIDER_FAILURE);
    const props = { documents: d.documents, retrieverVersion: d.retrieverVersion, k: d.k };
    const { unmount } = render(<RetrievalTable {...props} retrievalFailed />);
    expect(screen.getByText(/provider failed/)).toBeInTheDocument();
    expect(screen.getByText(/not an empty result/)).toBeInTheDocument();
    unmount();
    render(<RetrievalTable {...props} />);
    expect(screen.getByText(/ran and returned no documents/)).toBeInTheDocument();
  });

  it("shows retrieved document versions", () => {
    const d = diagnostics(UNSUPPORTED);
    render(
      <RetrievalTable documents={d.documents} retrieverVersion={d.retrieverVersion} k={d.k} />
    );
    expect(screen.getByRole("columnheader", { name: "Version" })).toBeInTheDocument();
    expect(screen.getAllByText("v6").length).toBeGreaterThan(0);
  });
});
