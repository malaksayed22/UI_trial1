import { Panel, PanelHeader } from "@/components/ui/panel";
import {
  TableScroll,
  tableCellClass,
  tableHeadClass,
} from "@/components/ui/table-scroll";
import { formatScore } from "@/lib/format";
import type { RetrievedDocument } from "@/types";

type RetrievalTableProps = {
  documents: RetrievedDocument[];
  retrieverVersion: string;
  k: number;
};

export const RetrievalTable = ({ documents, retrieverVersion, k }: RetrievalTableProps) => (
  <Panel aria-labelledby="retrieved-heading">
    <PanelHeader
      headingId="retrieved-heading"
      title="Retrieved documents"
      subtitle={`Ranked evidence returned by ${retrieverVersion} · top ${k}`}
    />
    {documents.length === 0 ? (
      <p className="text-sm text-muted">
        The retriever returned no documents for this query.
      </p>
    ) : (
      <TableScroll label="Retrieved documents">
        <table className="w-full min-w-[480px]">
          <caption className="sr-only">
            Documents by rank with similarity score (higher is better)
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={tableHeadClass}>Rank</th>
              <th scope="col" className={tableHeadClass}>Document</th>
              <th scope="col" className={tableHeadClass}>Title</th>
              <th scope="col" className={`${tableHeadClass} text-right`}>Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {documents.map(doc => (
              <tr key={`${doc.documentId}-${doc.rank}`}>
                <td className={`${tableCellClass} font-mono text-xs text-faint`}>#{doc.rank}</td>
                <th scope="row" className={`${tableCellClass} text-left font-mono text-xs font-normal text-info`}>
                  {doc.documentId}
                </th>
                <td className={`${tableCellClass} text-muted`}>{doc.title}</td>
                <td className={`${tableCellClass} text-right font-mono tabular-nums`}>
                  {formatScore(doc.score)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    )}
  </Panel>
);
