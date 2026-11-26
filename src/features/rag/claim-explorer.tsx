"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import type { AnswerClaim, RetrievedDocument, SourceDocument } from "@/types";
import { splitBySpans } from "./answer-segments";
import { initialClaimId, resolveEvidenceTrail, type EvidenceTrail } from "./evidence-trail";

const StatusTag = ({ status }: { status: AnswerClaim["status"] }) =>
  status === "supported" ? (
    <Tag tone="pass" icon={CheckCircle2}>Supported</Tag>
  ) : (
    <Tag tone="review" icon={XCircle}>Unsupported</Tag>
  );

const citationLabel = (claim: AnswerClaim, sources: SourceDocument[]) => {
  const { citation } = claim;
  if (!citation) return "No citation";
  const locator = sources
    .find(item => item.sourceId === citation.sourceId && item.version === citation.documentVersion)
    ?.passages.find(item => item.passageId === citation.passageId)?.locator;
  return [citation.sourceId, citation.documentVersion, locator].filter(Boolean).join(" · ");
};

type StepProps = { label: string; children: ReactNode };

const Step = ({ label, children }: StepProps) => (
  <li className="relative border-l border-line-strong pb-4 pl-4 last:pb-0">
    <span aria-hidden className="absolute -left-[3px] top-1.5 size-1.5 rounded-full bg-info" />
    <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{label}</p>
    <div className="mt-1.5 space-y-1.5 text-sm text-muted">{children}</div>
  </li>
);

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-xs text-ink">
    {children}
  </span>
);

const TrailView = ({ trail }: { trail: EvidenceTrail }) => {
  const { claim, source, passage, sourceSpan, state } = trail;
  const passageSegments = passage
    ? splitBySpans(passage.text, sourceSpan ? [{ span: sourceSpan, value: true }] : [])
    : [];

  return (
    <ol aria-label={`Evidence trail for claim: ${claim.text}`}>
      <Step label="1 · Claim">
        <p className="text-ink">“{claim.text}”</p>
        <p className="font-mono text-xs text-faint">
          Answer characters {claim.answerSpan.start}–{claim.answerSpan.end}
        </p>
        {claim.reason && (
          <p className="rounded-md border border-review/40 bg-review/10 px-2.5 py-1.5 text-review">
            {claim.reason}
          </p>
        )}
      </Step>

      <Step label="2 · Source ID and document version">
        {source ? (
          <>
            <p className="flex flex-wrap items-center gap-1.5">
              <Chip>{source.sourceId}</Chip>
              <Chip>{source.citedVersion}</Chip>
              {source.title && <span>{source.title}</span>}
            </p>
            {source.retrieval ? (
              <p className="text-xs text-faint">
                Retrieved at rank #{source.retrieval.rank}
                {!source.retrieval.versionMatches && (
                  <span className="text-review">
                    {" "}
                    · retrieved version {source.retrieval.retrievedVersion} differs from the cited
                    version
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-review">Cited, but not among the retrieved documents.</p>
            )}
          </>
        ) : (
          <p>No source was cited for this claim.</p>
        )}
      </Step>

      <Step label="3 · Selected passage">
        {passage ? (
          <>
            <p className="font-mono text-xs text-faint">{passage.locator}</p>
            <blockquote className="border-l-2 border-line-strong pl-3 leading-6">
              {passageSegments.map((segment, index) =>
                segment.value ? (
                  <mark key={index} className="rounded bg-pass/20 px-0.5 text-pass">
                    {segment.text}
                    <span className="sr-only"> (supporting span)</span>
                  </mark>
                ) : (
                  <span key={index}>{segment.text}</span>
                )
              )}
            </blockquote>
          </>
        ) : state === "source_unavailable" ? (
          <p className="text-review">The text of the cited passage was not delivered.</p>
        ) : (
          <p>No passage was selected.</p>
        )}
      </Step>

      <Step label="4 · Source span">
        {state === "supported" && sourceSpan && passage ? (
          <>
            <p className="font-mono text-xs text-faint">
              Passage characters {sourceSpan.start}–{sourceSpan.end}
            </p>
            <p className="text-ink">“{passage.text.slice(sourceSpan.start, sourceSpan.end)}”</p>
          </>
        ) : state === "cited_without_support" ? (
          <p className="text-review">
            None. The cited passage contains nothing that supports this claim.
          </p>
        ) : state === "source_unavailable" ? (
          <p className="text-review">Unknown. The source text is unavailable.</p>
        ) : (
          <p>None. There is no source to point to.</p>
        )}
      </Step>
    </ol>
  );
};

type ClaimExplorerProps = {
  answer: string;
  claims: AnswerClaim[];
  sources: SourceDocument[];
  documents: RetrievedDocument[];
};

/**
 * Follows each answer claim to its source ID and version, the selected
 * passage and the exact supporting span. Selection state is local; every value
 * shown is looked up from the backend's records.
 */
export const ClaimExplorer = ({ answer, claims, sources, documents }: ClaimExplorerProps) => {
  const [selectedId, setSelectedId] = useState(() => initialClaimId(claims));

  const segments = useMemo(
    () => splitBySpans(answer, claims.map(claim => ({ span: claim.answerSpan, value: claim }))),
    [answer, claims]
  );
  const selected = claims.find(claim => claim.claimId === selectedId) ?? null;
  const trail = selected ? resolveEvidenceTrail(selected, sources, documents) : null;

  return (
    <Panel aria-labelledby="claims-heading">
      <PanelHeader
        headingId="claims-heading"
        title="Generated answer and evidence trail"
        subtitle="Select a claim to follow it to its source, passage and supporting span."
      />
      <p className="border-l-2 border-info/60 pl-3 text-sm leading-7 text-muted">
        {segments.map((segment, index) => {
          const claim = segment.value;
          if (!claim) return <span key={index}>{segment.text}</span>;
          const isSelected = claim.claimId === selectedId;
          return (
            <button
              key={claim.claimId}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedId(claim.claimId)}
              className={cn(
                "rounded px-0.5 text-left underline underline-offset-4 transition-colors",
                claim.status === "supported"
                  ? "text-ink decoration-info/70 hover:bg-info/10"
                  : "bg-review/20 text-review decoration-dotted hover:bg-review/30",
                isSelected && "outline outline-2 outline-info"
              )}
            >
              {segment.text}
              <span className="sr-only">
                {claim.status === "supported" ? " (supported claim)" : " (unsupported claim)"}
              </span>
            </button>
          );
        })}
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ul aria-label="Claims" className="space-y-2">
          {claims.map((claim, index) => {
            const isSelected = claim.claimId === selectedId;
            return (
              <li key={claim.claimId}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(claim.claimId)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    isSelected
                      ? "border-info/60 bg-info/10"
                      : "border-line hover:border-line-strong hover:bg-raised"
                  )}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-faint">Claim {index + 1}</span>
                    <StatusTag status={claim.status} />
                  </span>
                  <span className="mt-1.5 block text-sm text-ink">“{claim.text}”</span>
                  <span className="mt-1.5 block font-mono text-xs text-muted">
                    {citationLabel(claim, sources)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div
          role="region"
          aria-label="Evidence trail"
          aria-live="polite"
          className="rounded-xl border border-line bg-canvas/40 p-4"
        >
          {trail ? (
            <TrailView trail={trail} />
          ) : (
            <p className="text-sm text-muted">Select a claim to see its evidence trail.</p>
          )}
        </div>
      </div>
    </Panel>
  );
};
