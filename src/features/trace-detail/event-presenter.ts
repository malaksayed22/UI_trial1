import {
  GitCommitHorizontal,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { TagTone } from "@/components/ui/tag";
import { formatDuration, formatScore } from "@/lib/format";
import type { TraceEvent } from "@/types";

export type EventPresentation = {
  /** Event family plus lifecycle, e.g. "TOOL RESULT · BLOCKED". */
  label: string;
  tone: TagTone;
  icon: LucideIcon;
  headline: string;
  /** Short facts shown under the headline. */
  facts: string[];
};

const latencyFact = (latencyMs: number | null) =>
  latencyMs === null ? null : formatDuration(latencyMs);

const compact = (items: (string | null)[]) =>
  items.filter((item): item is string => item !== null);

/**
 * Maps a typed event to its presentation. A proposed tool call, a blocked
 * result and an executed result are deliberately distinct so a blocked
 * proposal can never be mistaken for a successful action.
 */
export const presentEvent = (event: TraceEvent): EventPresentation => {
  switch (event.type) {
    case "retrieval": {
      const top = event.documents[0];
      return {
        label: "RETRIEVAL",
        tone: "info",
        icon: Search,
        headline: `Retrieved ${event.documents.map(d => d.documentId).join(", ") || "no documents"}`,
        facts: compact([
          top ? `top score ${formatScore(top.score)}` : null,
          event.retrieverVersion,
          latencyFact(event.latencyMs),
        ]),
      };
    }
    case "model_call":
      return {
        label: "MODEL CALL",
        tone: "model",
        icon: Sparkles,
        headline: event.summary,
        facts: compact([
          event.model,
          event.tokens
            ? `${event.tokens.input + event.tokens.output} tokens`
            : "token usage unavailable",
          latencyFact(event.latencyMs),
        ]),
      };
    case "agent_state":
      return {
        label: "AGENT STATE",
        tone: "neutral",
        icon: GitCommitHorizontal,
        headline: `workflow_stage: ${event.from} → ${event.to}`,
        facts: Object.entries(event.attributes).map(
          ([key, value]) => `${key} = ${String(value)}`
        ),
      };
    case "tool_call":
      return {
        label: "TOOL CALL · PROPOSED",
        tone: "review",
        icon: Wrench,
        headline: `${event.tool} proposed — not yet executed`,
        facts: Object.entries(event.arguments).map(
          ([key, value]) => `${key}: ${value}`
        ),
      };
    case "tool_result": {
      const outcome = {
        executed: { label: "EXECUTED", tone: "pass", icon: ShieldCheck },
        blocked: { label: "BLOCKED", tone: "block", icon: ShieldX },
        failed: { label: "FAILED", tone: "block", icon: ShieldAlert },
      } as const;
      const { label, tone, icon } = outcome[event.outcome];
      return {
        label: `TOOL RESULT · ${label}`,
        tone,
        icon,
        headline: event.detail,
        facts: compact([event.tool, latencyFact(event.latencyMs)]),
      };
    }
    case "final_response":
      return {
        label: "FINAL RESPONSE",
        tone: event.flags.length > 0 ? "review" : "neutral",
        icon: MessageSquare,
        headline: `“${event.text}”`,
        facts: event.flags.map(flag => `flag: ${flag}`),
      };
  }
};

/** Complete field list for the expanded event view (no raw JSON needed). */
export const eventFields = (event: TraceEvent): [string, string][] => {
  const common: [string, string][] = [
    ["Event ID", event.eventId],
    ["Sequence", String(event.sequence)],
    ["Parent", event.parentId ?? "None (root event)"],
    ["Timestamp (UTC)", event.timestamp],
    ["Latency", event.latencyMs === null ? "Not recorded" : formatDuration(event.latencyMs)],
  ];

  switch (event.type) {
    case "retrieval":
      return [
        ...common,
        ["Query", event.query],
        ["Retriever", event.retrieverVersion],
        ...event.documents.map<[string, string]>(doc => [
          `Rank ${doc.rank}`,
          `${doc.documentId} · ${doc.title} · score ${formatScore(doc.score)}`,
        ]),
      ];
    case "model_call":
      return [
        ...common,
        ["Model", event.model],
        [
          "Tokens",
          event.tokens
            ? `${event.tokens.input} in · ${event.tokens.output} out`
            : "Not recorded",
        ],
      ];
    case "agent_state":
      return [
        ...common,
        ["From", event.from],
        ["To", event.to],
        ...Object.entries(event.attributes).map<[string, string]>(
          ([key, value]) => [key, String(value)]
        ),
      ];
    case "tool_call":
      return [
        ...common,
        ["Tool", event.tool],
        ["Stage", event.stage],
        ...Object.entries(event.arguments).map<[string, string]>(
          ([key, value]) => [`Argument · ${key}`, value]
        ),
      ];
    case "tool_result":
      return [
        ...common,
        ["Tool", event.tool],
        ["Outcome", event.outcome],
        ["Policy findings", event.policyFindingIds.join(", ") || "None"],
      ];
    case "final_response":
      return [...common, ["Flags", event.flags.join(", ") || "None"]];
  }
};
