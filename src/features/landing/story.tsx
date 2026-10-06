"use client";

import { useRef, type ReactNode } from "react";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { cn } from "@/lib/cn";
import {
  evaluatorScores,
  gateMetrics,
  graphNodes,
  pipelineSteps,
  rootCauses,
  type NodeState,
} from "./data";
import { gsap, PINNED_STORY, useGSAP } from "./motion";
import { Eyebrow } from "./primitives";

const nodeStyle: Record<NodeState, { dot: string; text: string; tag: string }> = {
  ok: { dot: "bg-pass", text: "text-ink", tag: "ok" },
  missing: { dot: "border border-dashed border-review bg-transparent", text: "text-review", tag: "missing" },
  proposed: { dot: "bg-review", text: "text-ink", tag: "proposed" },
  blocked: { dot: "bg-block", text: "text-ink", tag: "blocked" },
  flagged: { dot: "bg-block/50 ring-2 ring-block/30", text: "text-ink", tag: "flagged" },
};

const toneBar = { pass: "bg-pass", review: "bg-review", block: "bg-block", muted: "bg-faint" } as const;

type PanelProps = { index: number; children: ReactNode };

const Panel = ({ index, children }: PanelProps) => {
  const step = pipelineSteps[index];
  if (!step) return null;
  return (
    <div
      data-panel
      className="story-panel flex flex-col rounded-2xl border border-line-strong bg-surface p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] sm:p-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          {step.number} / {step.title}
        </p>
        <p className="font-mono text-[11px] text-faint">{index + 1} of 4</p>
      </div>
      <h3 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">{step.headline}</h3>
      <div className="mt-6 flex-1">{children}</div>
      <p className="mt-6 border-t border-line pt-4 text-sm leading-relaxed text-muted">{step.caption}</p>
    </div>
  );
};

const TracePanel = () => (
  <ol className="relative space-y-1">
    <span aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-line-strong" />
    {graphNodes.map(node => {
      const style = nodeStyle[node.state];
      return (
        <li key={node.label} className="relative flex items-center gap-4 py-2">
          <span className={cn("relative z-10 size-[15px] shrink-0 rounded-full", style.dot)} />
          <span className={cn("text-[15px]", style.text)}>{node.label}</span>
          <span className={cn("ml-auto font-mono text-[11px] uppercase tracking-wider", node.state === "ok" ? "text-faint" : style.text)}>
            {style.tag}
          </span>
        </li>
      );
    })}
  </ol>
);

const EvidencePanel = () => (
  <ul className="space-y-4">
    {evaluatorScores.map(score => (
      <li key={score.name}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink">{score.name}</p>
          <p className="font-mono text-xs tabular-nums text-muted">
            {score.value === null ? "N/A" : score.value.toFixed(2)}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
          {score.value === null ? (
            <div className="h-full w-full border-y border-dashed border-line-strong" />
          ) : (
            <div
              data-fill
              className={cn("h-full origin-left rounded-full", toneBar[score.tone])}
              style={{ width: `${Math.max(score.value * 100, 1.5)}%` }}
            />
          )}
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-faint">
          {score.family} · {score.note}
        </p>
      </li>
    ))}
  </ul>
);

const CausePanel = () => (
  <ul className="space-y-3">
    {rootCauses.map(cause => (
      <li key={cause.cause} className="rounded-xl border border-line bg-canvas/50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-6 items-center justify-center rounded-full bg-ink font-mono text-xs font-medium text-canvas">
            {cause.rank}
          </span>
          <span className="font-mono text-sm text-ink">{cause.cause}</span>
          <span className="ml-auto font-mono text-sm tabular-nums text-ink">{cause.score.toFixed(2)}</span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-raised">
          <div
            data-fill
            className={cn("h-full origin-left rounded-full", cause.rank === 1 ? "bg-ink" : "bg-muted/60")}
            style={{ width: `${cause.score * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{cause.text}</p>
        <p className="mt-1.5 font-mono text-[11px] text-faint">evidence: {cause.events}</p>
      </li>
    ))}
  </ul>
);

const GatePanel = () => (
  <div>
    <div className="flex items-center justify-between gap-3 rounded-xl border border-block/30 bg-block/[0.06] px-4 py-3">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-faint">Candidate · retriever-v2.4.0</p>
        <p className="mt-1 text-sm text-muted">vs approved baseline · 1,200 traces</p>
      </div>
      <DecisionBadge decision="BLOCK" size="lg" />
    </div>
    <table className="mt-4 w-full text-left text-sm">
      <thead>
        <tr className="font-mono text-[11px] uppercase tracking-wider text-faint">
          <th className="py-2 pr-2 font-normal">Metric</th>
          <th className="px-2 text-right font-normal">Base</th>
          <th className="px-2 text-right font-normal">Cand.</th>
          <th className="py-2 pl-2 text-right font-normal">Δ</th>
        </tr>
      </thead>
      <tbody>
        {gateMetrics.map(metric => (
          <tr key={metric.name} data-pop className="border-t border-line">
            <td className="py-2.5 pr-2 text-ink">{metric.name}</td>
            <td className="px-2 text-right font-mono tabular-nums text-muted">{metric.baseline.toFixed(2)}</td>
            <td className="px-2 text-right font-mono tabular-nums text-ink">{metric.candidate.toFixed(2)}</td>
            <td
              className={cn(
                "py-2.5 pl-2 text-right font-mono tabular-nums",
                metric.status === "regression" ? "text-block" : "text-faint"
              )}
            >
              {metric.delta}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <p className="mt-3 rounded-lg bg-raised px-3 py-2 font-mono text-[11px] leading-relaxed text-muted">
      rule: a severe regression without a critical failure resolves to BLOCK
    </p>
  </div>
);

const STEP_DIM = 0.55;
const TRANSITION = 0.9;

export const Story = () => {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const mm = gsap.matchMedia();

      mm.add(PINNED_STORY, () => {
        section.dataset.pinned = "true";
        const panels = q("[data-panel]");
        const steps = q("[data-step]");
        const rail = q("[data-rail]");
        const stages = panels.slice(1);

        gsap.set(stages, { autoAlpha: 0, y: 36 });
        gsap.set(steps.slice(1), { opacity: STEP_DIM });
        stages.forEach(panel => {
          gsap.set(panel.querySelectorAll("[data-fill]"), { scaleX: 0, opacity: 0.4 });
          gsap.set(panel.querySelectorAll("[data-pop]"), { opacity: 0, y: 10 });
        });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: q("[data-pin]")[0],
            start: "top top",
            end: "+=330%",
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
          },
        });

        tl.to(rail, { scaleY: 1, duration: 6, ease: "none" }, 0);

        stages.forEach((panel, i) => {
          const at = 1 + i * 2;
          const previous = panels[i];
          const fills = panel.querySelectorAll("[data-fill]");
          const current = steps[i];
          const next = steps[i + 1];
          if (!previous || !current || !next) return;
          tl.to(previous, { autoAlpha: 0, y: -28, scale: 0.985, duration: TRANSITION }, at)
            .to(panel, { autoAlpha: 1, y: 0, duration: TRANSITION }, at + 0.25)
            .to(fills, { scaleX: 1, opacity: 1, duration: 0.9, stagger: 0.07, ease: "power3.out" }, at + 0.6)
            .to(panel.querySelectorAll("[data-pop]"), { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }, at + 0.7)
            .to(current, { opacity: STEP_DIM, duration: 0.5 }, at)
            .to(next, { opacity: 1, duration: 0.5 }, at);
        });
        tl.to({}, { duration: 0.6 });

        return () => {
          delete section.dataset.pinned;
        };
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} id="how" className="relative border-t border-line">
      <div data-pin className="mx-auto flex max-w-7xl flex-col justify-center px-5 py-24 sm:px-8 lg:min-h-screen lg:py-0">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-20">
          <div>
            <div data-reveal>
              <Eyebrow>From request to verdict</Eyebrow>
              <h2 className="mt-6 text-[clamp(2.4rem,5vw,4.4rem)] font-medium leading-[1] tracking-[-0.04em]">
                One request.
                <br />
                <span className="font-serif font-normal italic tracking-[-0.02em] text-muted">Four</span> answers.
              </h2>
            </div>

            <ol className="relative mt-12 space-y-7 pl-8">
              <span aria-hidden className="absolute bottom-1 left-[5px] top-1 w-px bg-line-strong" />
              <span
                data-rail
                aria-hidden
                className="absolute bottom-1 left-[5px] top-1 w-px origin-top bg-ink"
                style={{ transform: "scaleY(0)" }}
              />
              {pipelineSteps.map(step => (
                <li key={step.key} data-step className="relative">
                  <span aria-hidden className="absolute -left-8 top-[7px] size-[11px] rounded-full border border-line-strong bg-canvas" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{step.number}</p>
                  <p className="mt-1 text-xl font-medium tracking-tight">{step.title}</p>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{step.summary}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="story-stage flex flex-col gap-6">
            <Panel index={0}>
              <TracePanel />
            </Panel>
            <Panel index={1}>
              <EvidencePanel />
            </Panel>
            <Panel index={2}>
              <CausePanel />
            </Panel>
            <Panel index={3}>
              <GatePanel />
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
};
