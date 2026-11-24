import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { traceDetails } from "@/mocks/fixtures";

/**
 * TRUSTOPS_RECREATION_PROMPTS.md describes trace-8f21c9a4 for anyone rebuilding
 * the UI. Its event and graph-node counts must match the fixture.
 */

const DOC = readFileSync(path.resolve(__dirname, "../../TRUSTOPS_RECREATION_PROMPTS.md"), "utf-8");
const trace = traceDetails["trace-8f21c9a4"]!;
const NUMBER_WORDS: Record<string, number> = {
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

const between = (start: string, end: string) => {
  const from = DOC.indexOf(start);
  const to = DOC.indexOf(end, from);
  expect(from, start).toBeGreaterThan(-1);
  expect(to, end).toBeGreaterThan(from);
  return DOC.slice(from, to);
};

describe("recreation prompts match the trace-8f21c9a4 fixture", () => {
  it("states the timeline event count in the timeline subtitle", () => {
    const count = /Ordered execution timeline,\u201d subtitle \u201c(\d+) events/.exec(DOC)?.[1];
    expect(Number(count)).toBe(trace.events.length);
  });

  it("lists one numbered row per timeline event, in order, including ev-sup-1", () => {
    const section = between("ORDERED EXECUTION TIMELINE", "EXECUTION GRAPH");
    const rows = section.split("\n").filter(line => /^\d+\. \d\d:\d\d:\d\d\.\d{3} /.test(line));
    expect(rows).toHaveLength(trace.events.length);
    rows.forEach((row, index) => {
      expect(row.startsWith(`${index + 1}. `)).toBe(true);
      const time = /(\d\d:\d\d:\d\d\.\d{3})/.exec(row)![1];
      expect(trace.events[index]!.timestamp, row).toContain(`T${time}Z`);
    });
    const snapshot = trace.events.findIndex(event => event.eventId === "ev-sup-1");
    expect(rows[snapshot]).toMatch(/SUPPLIER DIRECTORY SNAPSHOT.*ev-sup-1/);
  });

  it("lists every graph node n1 to n7 with its label, and no node for the supplier snapshot", () => {
    const section = between("EXECUTION GRAPH", "On mobile stack the graph");
    const stated = /Stack (\w+) connected bordered nodes/.exec(section)?.[1];
    expect(NUMBER_WORDS[stated!], `unknown number word "${stated}"`).toBe(trace.graph.nodes.length);
    trace.graph.nodes.forEach(node => {
      expect(section, node.nodeId).toContain(`${node.nodeId} ${node.kind}: `);
      expect(section, node.label).toContain(node.label);
    });
    expect(section).toContain("no graph node");
    expect(trace.graph.nodes.some(node => node.eventId === "ev-sup-1")).toBe(false);
  });

  it("gives the Tier-2 approval node no event ID", () => {
    const missing = trace.graph.nodes.filter(node => node.eventId === null);
    expect(missing.map(node => node.label)).toEqual(["Tier-2 approval"]);
    expect(between("n4 approval", "n5 tool_call")).toMatch(/no event ID/);
  });

  it("repeats the same counts in the final checklist", () => {
    const line = DOC.split("\n").find(row => row.startsWith("[ ] Trace Detail includes"))!;
    const [, events, nodes] = /all (\w+) timeline events and (\w+) graph nodes/.exec(line)!;
    expect(NUMBER_WORDS[events!]).toBe(trace.events.length);
    expect(NUMBER_WORDS[nodes!]).toBe(trace.graph.nodes.length);
  });

  it("keeps no stale seven-event or six-node wording", () => {
    expect(DOC).not.toMatch(/\b(six|6) (connected bordered |graph )?nodes/i);
    expect(DOC).not.toMatch(/\b(seven|7) (ordered |timeline )?events/i);
  });
});
