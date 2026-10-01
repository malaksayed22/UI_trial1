export type AnswerSegment = { text: string; unsupported: boolean };

/**
 * Splits an answer so unsupported claims can be highlighted in place.
 * Matching is case-insensitive; claims not found verbatim are simply not
 * highlighted (they are still listed in the unsupported-claims alert).
 */
export const segmentAnswer = (
  answer: string,
  unsupportedClaims: string[]
): AnswerSegment[] => {
  const lowered = answer.toLowerCase();
  const ranges = unsupportedClaims
    .map(claim => {
      const start = lowered.indexOf(claim.toLowerCase());
      return start === -1 ? null : { start, end: start + claim.length };
    })
    .filter((range): range is { start: number; end: number } => range !== null)
    .sort((a, b) => a.start - b.start);

  const segments: AnswerSegment[] = [];
  let cursor = 0;
  for (const { start, end } of ranges) {
    if (start < cursor) continue; // overlapping claim, already covered
    if (start > cursor) {
      segments.push({ text: answer.slice(cursor, start), unsupported: false });
    }
    segments.push({ text: answer.slice(start, end), unsupported: true });
    cursor = end;
  }
  if (cursor < answer.length) {
    segments.push({ text: answer.slice(cursor), unsupported: false });
  }
  return segments.length > 0 ? segments : [{ text: answer, unsupported: false }];
};
