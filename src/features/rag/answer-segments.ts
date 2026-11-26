import type { TextSpan } from "@/types";

export type Segment<T> = { text: string; value: T | null };

/**
 * Splits `text` at the given spans so each can be rendered or highlighted in
 * place. Spans come from the backend as exact offsets, so nothing is matched
 * by searching. Spans that are out of range, empty or overlap an earlier span
 * are dropped rather than guessed at.
 */
export const splitBySpans = <T>(
  text: string,
  items: { span: TextSpan; value: T }[]
): Segment<T>[] => {
  const valid = items
    .filter(({ span }) => span.start >= 0 && span.end <= text.length && span.start < span.end)
    .sort((a, b) => a.span.start - b.span.start);

  const segments: Segment<T>[] = [];
  let cursor = 0;
  for (const { span, value } of valid) {
    if (span.start < cursor) continue;
    if (span.start > cursor) {
      segments.push({ text: text.slice(cursor, span.start), value: null });
    }
    segments.push({ text: text.slice(span.start, span.end), value });
    cursor = span.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), value: null });
  }
  return segments.length > 0 ? segments : [{ text, value: null }];
};
