"use client";

import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { TRACE_ID, traceSpans, trend } from "./data";
import { Eyebrow, SpotlightCard } from "./primitives";

type ScreenCardProps = {
  number: string;
  name: string;
  title: string;
  text: string;
  href: string;
  className?: string;
  children: ReactNode;
};

const ScreenCard = ({ number, name, title, text, href, className, children }: ScreenCardProps) => (
  <SpotlightCard data-reveal href={href} label={`Open ${name}`} className={cn("flex flex-col rounded-2xl p-6", className)}>
    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
      <span>
        {number} · {name}
      </span>
      <ArrowUpRight
        aria-hidden
        className="size-4 -translate-x-1 translate-y-1 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
      />
    </div>
    <h3 className="mt-5 text-xl font-medium tracking-tight">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{text}</p>
    <div className="mt-auto pt-8">{children}</div>
  </SpotlightCard>
);

const TrendChart = () => {
  const peak = Math.max(...trend.pass.map((pass, i) => pass + (trend.review[i] ?? 0) + (trend.block[i] ?? 0)));
  return (
    <div className="flex h-32 items-end gap-1.5" role="img" aria-label="Fourteen-day decision mix">
      {trend.pass.map((pass, i) => {
        const review = trend.review[i] ?? 0;
        const block = trend.block[i] ?? 0;
        const pct = (value: number) => `${(value / peak) * 100}%`;
        return (
          <div key={i} className="flex h-full flex-1 flex-col-reverse gap-px overflow-hidden rounded-[3px]">
            <span className="bg-ink/15 transition-colors duration-300 group-hover:bg-ink/25" style={{ height: pct(pass) }} />
            <span className="bg-review" style={{ height: pct(review) }} />
            <span className="bg-block" style={{ height: pct(block) }} />
          </div>
        );
      })}
    </div>
  );
};

const apps = [
  { name: "Procurement Agent", total: 1842, pass: 1741, review: 51, block: 50 },
  { name: "Enterprise RAG Assistant", total: 1196, pass: 1079, review: 103, block: 14 },
] as const;

const AppDistribution = () => (
  <ul className="space-y-4">
    {apps.map(app => (
      <li key={app.name}>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-ink">{app.name}</span>
          <span className="font-mono text-xs tabular-nums text-faint">{app.total.toLocaleString("en-US")} traces</span>
        </div>
        <div className="mt-2 flex h-1.5 gap-px overflow-hidden rounded-full">
          <span className="bg-ink/20" style={{ width: `${(app.pass / app.total) * 100}%` }} />
          <span className="bg-review" style={{ width: `${(app.review / app.total) * 100}%` }} />
          <span className="bg-block" style={{ width: `${(app.block / app.total) * 100}%` }} />
        </div>
      </li>
    ))}
  </ul>
);

const explorerRows = [
  { id: TRACE_ID, label: "approval_requirement_unmet", decision: "BLOCK" },
  { id: "trace-2f88b1e0", label: "retrieval_failure", decision: "BLOCK" },
  { id: "trace-6c41d9f2", label: "weak_grounding", decision: "REVIEW" },
] as const;

const decisionText = { BLOCK: "text-block", REVIEW: "text-review" } as const;

const ExplorerPreview = () => (
  <div>
    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
      {["decision: not PASS", "app: any", "label: any"].map(chip => (
        <span key={chip} className="rounded-full border border-line-strong px-2.5 py-1 text-muted">
          {chip}
        </span>
      ))}
    </div>
    <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-canvas/40">
      {explorerRows.map(row => (
        <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2 font-mono text-[11px]">
          <span className="truncate text-ink">{row.id.replace("trace-", "")}</span>
          <span className="hidden truncate text-faint sm:inline">{row.label}</span>
          <span className={decisionText[row.decision]}>{row.decision}</span>
        </li>
      ))}
    </ul>
  </div>
);

const toneFill = { info: "bg-info", model: "bg-model", review: "bg-review", block: "bg-block", muted: "bg-faint" } as const;

const WaterfallPreview = () => (
  <ul className="space-y-2.5">
    {traceSpans.slice(0, 5).map(span => (
      <li key={span.id} className="relative h-2 rounded-full bg-raised">
        <span
          className={cn("absolute top-0 h-2 rounded-full", toneFill[span.tone])}
          style={{ left: `${(span.startMs / 1288) * 96}%`, width: `max(${(span.durationMs / 1288) * 96}%, 8px)` }}
        />
      </li>
    ))}
  </ul>
);

const retrievals = [
  { id: "HR-204", score: 0.88 },
  { id: "HR-117", score: 0.71 },
  { id: "TRV-032", score: 0.43 },
] as const;

const RetrievalPreview = () => (
  <div>
    <ul className="space-y-2">
      {retrievals.map((doc, index) => (
        <li key={doc.id} className="flex items-center gap-3 font-mono text-[11px]">
          <span className="w-4 text-faint">#{index + 1}</span>
          <span className="w-14 text-ink">{doc.id}</span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
            <span className="block h-full rounded-full bg-info" style={{ width: `${doc.score * 100}%` }} />
          </span>
          <span className="tabular-nums text-muted">{doc.score.toFixed(2)}</span>
        </li>
      ))}
    </ul>
    <p className="mt-4 text-[13px] leading-relaxed text-muted">
      International flights are reimbursable{" "}
      <mark className="rounded-sm bg-block/15 px-1 text-block underline decoration-block/60 decoration-dotted underline-offset-4">
        up to $2,000 without approval
      </mark>
      .
    </p>
  </div>
);

const CausePreview = () => (
  <ul className="space-y-3">
    {[
      ["agent_workflow", 0.91],
      ["prompt", 0.74],
      ["policy_configuration", 0.52],
    ].map(([cause, score], index) => (
      <li key={cause} className="flex items-center gap-3 font-mono text-[11px]">
        <span className="flex size-5 items-center justify-center rounded-full bg-raised text-ink">{index + 1}</span>
        <span className="w-36 truncate text-ink">{cause}</span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
          <span className={cn("block h-full rounded-full", index === 0 ? "bg-ink" : "bg-muted/50")} style={{ width: `${Number(score) * 100}%` }} />
        </span>
        <span className="tabular-nums text-muted">{Number(score).toFixed(2)}</span>
      </li>
    ))}
  </ul>
);

const gates = [
  { label: "retriever-v2.4.0", verdict: "BLOCK" },
  { label: "agent-v2.4.1", verdict: "PASS" },
  { label: "prompt-v1.9.0", verdict: "REVIEW" },
  { label: "model-v1.8.2", verdict: "PASS" },
] as const;

const verdictDot = { PASS: "bg-pass", REVIEW: "bg-review", BLOCK: "bg-block" } as const;
const verdictText = { PASS: "text-pass", REVIEW: "text-review", BLOCK: "text-block" } as const;

const GatePreview = () => (
  <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
    {gates.map(gate => (
      <li key={gate.label} className="flex items-center justify-between gap-3 bg-surface px-3 py-2.5 font-mono text-[11px]">
        <span className="flex items-center gap-2 text-ink">
          <span aria-hidden className={cn("size-1.5 rounded-full", verdictDot[gate.verdict])} />
          {gate.label}
        </span>
        <span className={verdictText[gate.verdict]}>{gate.verdict}</span>
      </li>
    ))}
  </ul>
);

export const Screens = () => (
  <section id="screens" className="relative border-t border-line py-24 sm:py-32">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div data-reveal className="max-w-3xl">
        <Eyebrow>The console</Eyebrow>
        <h2 className="mt-6 text-[clamp(2.4rem,5vw,4.4rem)] font-medium leading-[1] tracking-[-0.04em]">
          Seven screens.
          <br />
          One <span className="font-serif font-normal italic tracking-[-0.02em] text-muted">chain of custody.</span>
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          A reviewer moves from a fleet-level signal to a single event, and from there to a release decision,
          without ever losing the evidence behind it.
        </p>
      </div>

      <div className="mt-16 grid gap-4 lg:grid-cols-12">
        <ScreenCard
          number="01"
          name="Overview"
          title="Reliability at a glance"
          text="Decision mix, failure classes and the 14-day trend. The question it answers: is anything getting worse?"
          href={routes.overview}
          className="lg:col-span-7"
        >
          <TrendChart />
        </ScreenCard>
        <ScreenCard
          number="02"
          name="Applications"
          title="Every app, one standard"
          text="Versions, trace volume and recent gates side by side."
          href={routes.applications}
          className="lg:col-span-5"
        >
          <AppDistribution />
        </ScreenCard>
        <ScreenCard
          number="03"
          name="Trace Explorer"
          title="Find the one in thousands"
          text="Filters live in the URL, so a view is shareable and survives Back."
          href={routes.traces}
          className="lg:col-span-4"
        >
          <ExplorerPreview />
        </ScreenCard>
        <ScreenCard
          number="04"
          name="Trace Detail"
          title="Replay the execution"
          text="Ordered events, graph and evaluator evidence for one request."
          href={routes.trace(TRACE_ID)}
          className="lg:col-span-4"
        >
          <WaterfallPreview />
        </ScreenCard>
        <ScreenCard
          number="05"
          name="RAG Diagnostics"
          title="Did evidence support the claim?"
          text="Retrieval ranks and answer segments, checked against sources."
          href={routes.rag("trace-2f88b1e0")}
          className="lg:col-span-4"
        >
          <RetrievalPreview />
        </ScreenCard>
        <ScreenCard
          number="06"
          name="Failure & RCA"
          title="From symptom to cause"
          text="The primary failure, a ranked top-3 and the path to the decision."
          href={routes.investigation(TRACE_ID)}
          className="lg:col-span-5"
        >
          <CausePreview />
        </ScreenCard>
        <ScreenCard
          number="07"
          name="Release Gate"
          title="Ship on evidence"
          text="Candidate versus approved baseline, resolved to PASS, REVIEW or BLOCK with the rule that decided it."
          href={routes.releaseGates}
          className="lg:col-span-7"
        >
          <GatePreview />
        </ScreenCard>
      </div>
    </div>
  </section>
);
