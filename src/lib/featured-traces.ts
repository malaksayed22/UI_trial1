import { api } from "@/lib/api";
import type { TraceSummary } from "@/types";

/** Trace IDs the sidebar opens for screens 04–06 when no trace is selected. */
export type FeaturedTraces = {
  detail: string | null;
  rag: string | null;
  investigation: string | null;
};

const none: FeaturedTraces = { detail: null, rag: null, investigation: null };

/**
 * Picks the most recent traces worth investigating (not PASS), so the
 * trace-scoped screens are always one click away. Newest first is the list
 * contract's order, so the first match is the latest.
 */
export const pickFeaturedTraces = (traces: TraceSummary[]): FeaturedTraces => {
  const flagged = traces.filter(trace => trace.decision !== "PASS");
  const first = flagged[0] ?? traces[0];
  const firstRag = flagged.find(trace => trace.application === "rag-assistant");
  return {
    detail: first?.traceId ?? null,
    rag: firstRag?.traceId ?? null,
    investigation: first?.traceId ?? null,
  };
};

export const loadFeaturedTraces = async (): Promise<FeaturedTraces> => {
  try {
    const { items } = await api.listTraces({ pageSize: 50 });
    return pickFeaturedTraces(items);
  } catch {
    return none;
  }
};
