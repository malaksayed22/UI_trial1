import { EvidenceLinks } from "@/components/ui/evidence-link";
import { MeasurementValue } from "@/components/ui/measurement-value";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import {
  TableScroll,
  tableCellClass,
  tableHeadClass,
} from "@/components/ui/table-scroll";
import { evaluatorFamilyText } from "@/lib/labels";
import type { EvaluatorResult } from "@/types";

type EvaluatorEvidenceProps = {
  traceId: string;
  results: EvaluatorResult[];
  headingId?: string;
};

export const EvaluatorEvidence = ({
  traceId,
  results,
  headingId = "evaluator-evidence",
}: EvaluatorEvidenceProps) => (
  <Panel aria-labelledby={headingId}>
    <PanelHeader
      headingId={headingId}
      title="Evaluator evidence"
      subtitle="Scores are evidence, not ground truth. Semantic (LLM) judgements are fallible."
    />
    <TableScroll label="Evaluator results">
      <table className="w-full min-w-[720px]">
        <caption className="sr-only">
          Evaluator name, version, result, finding and supporting events
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={tableHeadClass}>Evaluator</th>
            <th scope="col" className={tableHeadClass}>Result</th>
            <th scope="col" className={tableHeadClass}>Finding</th>
            <th scope="col" className={tableHeadClass}>Evidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {results.map(result => (
            <tr key={result.evaluatorId}>
              <th scope="row" className={`${tableCellClass} text-left font-normal`}>
                <span className="block text-ink">{result.name}</span>
                <span className="mt-1 flex items-center gap-2">
                  <Tag>{evaluatorFamilyText[result.family]}</Tag>
                  <span className="font-mono text-xs text-faint">
                    {result.version}
                  </span>
                </span>
              </th>
              <td className={tableCellClass}>
                <MeasurementValue measurement={result.outcome} showDirection />
              </td>
              <td className={`${tableCellClass} max-w-md text-muted`}>
                {result.finding ?? <span className="text-faint">—</span>}
              </td>
              <td className={tableCellClass}>
                <EvidenceLinks
                  traceId={traceId}
                  eventIds={result.evidenceEventIds}
                  emptyLabel="—"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  </Panel>
);
