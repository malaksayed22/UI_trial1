import { AlertTriangle, Ban, CheckCircle2, CircleDashed, Diamond } from "lucide-react";
import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag, type TagTone } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { relationText } from "@/lib/labels";
import type { GraphNode, GraphNodeKind, GraphNodeState, TraceGraph as TraceGraphModel } from "@/types";

const stateView: Record<
  GraphNodeState,
  { label: string; tone: TagTone; icon: typeof CheckCircle2; border: string }
> = {
  ok: { label: "Completed", tone: "pass", icon: CheckCircle2, border: "border-line-strong" },
  proposed: { label: "Proposed", tone: "review", icon: Diamond, border: "border-dashed border-review/50" },
  blocked: { label: "Blocked", tone: "block", icon: Ban, border: "border-block/60" },
  flagged: { label: "Flagged", tone: "review", icon: AlertTriangle, border: "border-review/50" },
  missing: { label: "Missing", tone: "block", icon: CircleDashed, border: "border-dashed border-block/60" },
};

const kindText: Record<GraphNodeKind, string> = {
  retrieval: "Retrieval",
  model_call: "Model call",
  agent_state: "Agent state",
  tool_call: "Tool proposal",
  tool_result: "Tool result",
  final_response: "Final response",
  approval: "Approval",
};

type TraceGraphProps = { traceId: string; graph: TraceGraphModel };

/**
 * Renders the backend-derived graph. Nodes are in execution order; semantic
 * relationships (approval, policy block, unsupported completion) are listed
 * under the node they originate from. Nothing is derived in the browser.
 */
export const TraceGraph = ({ graph }: TraceGraphProps) => {
  const nodes = [...graph.nodes].sort((a, b) => a.order - b.order);
  const byId = new Map<string, GraphNode>(nodes.map(node => [node.nodeId, node]));

  return (
    <Panel aria-labelledby="graph-heading" className="h-fit">
      <PanelHeader
        headingId="graph-heading"
        title="Execution graph"
        subtitle="Backend-derived event relationships"
      />
      <ol className="space-y-2">
        {nodes.map(node => {
          const view = stateView[node.state];
          const relations = graph.edges.filter(
            edge => edge.from === node.nodeId && edge.relation !== "sequence"
          );
          return (
            <li key={node.nodeId} id={`graph-${node.nodeId}`} className="scroll-mt-24">
              <div className={cn("rounded-lg border bg-canvas/40 p-3", view.border)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-faint">
                    {String(node.order).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-muted">{kindText[node.kind]}</span>
                  <Tag tone={view.tone} icon={view.icon} className="ml-auto">
                    {view.label}
                  </Tag>
                </div>
                <p className="mt-1.5 break-words font-mono text-sm text-ink">{node.label}</p>
                {node.eventId ? (
                  <Link
                    href={`#event-${node.eventId}`}
                    className="mt-1.5 inline-block text-xs text-info hover:underline"
                  >
                    View event {node.eventId}
                  </Link>
                ) : (
                  <p className="mt-1.5 text-xs text-block">
                    Expected evidence is absent: no event was recorded.
                  </p>
                )}
                {relations.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-line pt-2">
                    {relations.map(edge => {
                      const target = byId.get(edge.to);
                      return (
                        <li key={`${edge.relation}-${edge.to}`} className="text-xs text-muted">
                          {relationText[edge.relation]}{" "}
                          <Link href={`#graph-${edge.to}`} className="text-info hover:underline">
                            {target
                              ? `${String(target.order).padStart(2, "0")} ${target.label}`
                              : edge.to}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-faint">Legend</p>
        <ul className="flex flex-wrap gap-2">
          {(Object.keys(stateView) as GraphNodeState[]).map(state => {
            const view = stateView[state];
            return (
              <li key={state}>
                <Tag tone={view.tone} icon={view.icon}>{view.label}</Tag>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
};
