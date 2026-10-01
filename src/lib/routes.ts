/** Central route builders so every deep link stays consistent. */

export const routes = {
  overview: "/overview",
  applications: "/applications",
  traces: "/traces",
  trace: (traceId: string) => `/traces/${encodeURIComponent(traceId)}`,
  rag: (traceId: string) => `/traces/${encodeURIComponent(traceId)}/rag`,
  investigation: (traceId: string) =>
    `/traces/${encodeURIComponent(traceId)}/investigation`,
  releaseGates: "/release-gates",
  releaseGate: (runId: string) => `/release-gates/${encodeURIComponent(runId)}`,
} as const;

export const traceEventHref = (traceId: string, eventId: string) =>
  `${routes.trace(traceId)}#event-${eventId}`;

/** Builds a Trace Explorer URL preserving only the provided filters. */
export const tracesHref = (filters: Record<string, string | undefined> = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `${routes.traces}?${query}` : routes.traces;
};
