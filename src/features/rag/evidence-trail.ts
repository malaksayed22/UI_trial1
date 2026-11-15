import type {
  AnswerClaim,
  RetrievedDocument,
  SourceDocument,
  SourcePassage,
  TextSpan,
} from "@/types";

/**
 * Where a claim's evidence trail ends:
 * - `supported`: the cited passage contains a supporting span.
 * - `cited_without_support`: the model cited a passage that does not support the claim.
 * - `uncited`: the model cited nothing.
 * - `source_unavailable`: a citation exists but its source text was not delivered.
 */
export type TrailState =
  | "supported"
  | "cited_without_support"
  | "uncited"
  | "source_unavailable";

export type EvidenceTrail = {
  claim: AnswerClaim;
  state: TrailState;
  source: {
    sourceId: string;
    citedVersion: string;
    title: string | null;
    /** Null when the cited document is not among the retrieved documents. */
    retrieval: { rank: number; retrievedVersion: string; versionMatches: boolean } | null;
  } | null;
  passage: SourcePassage | null;
  sourceSpan: TextSpan | null;
};

/**
 * Follows a claim to its source, passage and span. This looks records up; it
 * never re-judges whether the claim is supported. That verdict is the
 * backend's `claim.status`.
 */
export const resolveEvidenceTrail = (
  claim: AnswerClaim,
  sources: SourceDocument[],
  documents: RetrievedDocument[]
): EvidenceTrail => {
  const { citation } = claim;
  if (!citation) {
    return { claim, state: "uncited", source: null, passage: null, sourceSpan: null };
  }

  const document = sources.find(
    item => item.sourceId === citation.sourceId && item.version === citation.documentVersion
  );
  const retrieved = documents.find(item => item.documentId === citation.sourceId);
  const passage = document?.passages.find(item => item.passageId === citation.passageId) ?? null;

  const source = {
    sourceId: citation.sourceId,
    citedVersion: citation.documentVersion,
    title: document?.title ?? retrieved?.title ?? null,
    retrieval: retrieved
      ? {
          rank: retrieved.rank,
          retrievedVersion: retrieved.version,
          versionMatches: retrieved.version === citation.documentVersion,
        }
      : null,
  };

  if (!passage) {
    return { claim, state: "source_unavailable", source, passage: null, sourceSpan: null };
  }
  return {
    claim,
    state: citation.sourceSpan ? "supported" : "cited_without_support",
    source,
    passage,
    sourceSpan: citation.sourceSpan,
  };
};

/** The claim to open first: the first unsupported one, else the first claim. */
export const initialClaimId = (claims: AnswerClaim[]): string | null =>
  (claims.find(claim => claim.status === "unsupported") ?? claims[0])?.claimId ?? null;
