import { Panel } from "@/components/ui/panel";
import type { RagDiagnostics } from "@/types";
import { segmentAnswer } from "./answer-segments";

type QueryAndAnswerProps = { diagnostics: RagDiagnostics };

export const QueryAndAnswer = ({ diagnostics }: QueryAndAnswerProps) => {
  const segments = segmentAnswer(
    diagnostics.answer,
    diagnostics.unsupportedClaims.map(item => item.claim)
  );
  return (
    <Panel aria-labelledby="query-heading">
      <h2 id="query-heading" className="font-mono text-xs uppercase tracking-wider text-faint">
        User query
      </h2>
      <p className="mt-2 text-base italic text-ink">“{diagnostics.query}”</p>

      <h3 className="mt-5 font-mono text-xs uppercase tracking-wider text-faint">
        Generated answer
      </h3>
      <p className="mt-2 border-l-2 border-info/60 pl-3 text-sm leading-6 text-muted">
        {segments.map((segment, index) =>
          segment.unsupported ? (
            <mark
              key={index}
              className="rounded bg-review/20 px-0.5 text-review underline decoration-dotted underline-offset-4"
              title="No retrieved document supports this claim"
            >
              {segment.text}
              <span className="sr-only"> (unsupported claim)</span>
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        )}
      </p>
    </Panel>
  );
};
