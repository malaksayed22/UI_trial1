import { Panel } from "@/components/ui/panel";
import type { RagDiagnostics } from "@/types";
import { RagOutcomeNotice, RagOutcomeTag } from "./rag-outcome";

type QueryAndAnswerProps = { diagnostics: RagDiagnostics };

/**
 * The query and what the pipeline did with it. When claims exist the answer
 * itself is shown in the claim explorer, where each claim can be followed to
 * its source, so it is not repeated here.
 */
export const QueryAndAnswer = ({ diagnostics }: QueryAndAnswerProps) => {
  const { answer, claims, outcome } = diagnostics;
  const showsAnswer = claims.length === 0;

  return (
    <Panel aria-labelledby="query-heading">
      <h2 id="query-heading" className="font-mono text-xs uppercase tracking-wider text-faint">
        User query
      </h2>
      <p className="mt-2 text-base italic text-ink">“{diagnostics.query}”</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h3 className="font-mono text-xs uppercase tracking-wider text-faint">Outcome</h3>
        <RagOutcomeTag outcome={outcome} />
      </div>
      <RagOutcomeNotice outcome={outcome} />

      {showsAnswer && (
        <>
          <h3 className="mt-5 font-mono text-xs uppercase tracking-wider text-faint">
            Generated answer
          </h3>
          {answer === null ? (
            <p className="mt-2 text-sm text-muted">The model produced no answer for this trace.</p>
          ) : (
            <p className="mt-2 border-l-2 border-info/60 pl-3 text-sm leading-6 text-muted">
              {answer}
            </p>
          )}
        </>
      )}
    </Panel>
  );
};
