"use client";

import { useRef } from "react";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { cn } from "@/lib/cn";
import { TRACE_DURATION_MS, TRACE_ID, traceSpans, type SpanTone } from "./data";
import { gsap, MOTION_OK, useGSAP } from "./motion";

const AXIS_TICKS = [0, 0.25, 0.5, 0.75, 1] as const;
const REPLAY_SECONDS = 4.4;
const SWEEP_START = 0.5;
const CONFIDENCE = 0.93;

const barTone: Record<SpanTone, string> = {
  info: "bg-info",
  model: "bg-model",
  review: "bg-review",
  block: "bg-block",
  muted: "bg-faint",
};

const kindTone: Record<SpanTone, string> = {
  info: "text-info",
  model: "text-model",
  review: "text-review",
  block: "text-block",
  muted: "text-faint",
};

const findings = [
  { id: "PROC-APPROVAL-01", rule: "approval_required_before_po", level: "critical" },
  { id: "PROC-TOOL-STAGE-01", rule: "tool_requires_approved_stage", level: "critical" },
  { id: "PROC-SUPPLIER-01", rule: "supplier_tier_check", level: "high" },
] as const;

const percentOf = (ms: number) => (ms / TRACE_DURATION_MS) * 100;

/**
 * A looping replay of the reviewed approval-bypass trace. The DOM is authored in
 * its final state, so reduced-motion users and no-JS renders see the verdict.
 */
export const TraceReplay = () => {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const rows = q("[data-row]");
        const bars = q("[data-bar]");
        const playhead = q("[data-playhead]");
        const scoring = q("[data-scoring]");
        const verdict = q("[data-verdict]");
        const findingRows = q("[data-finding]");
        const confidence = q("[data-confidence]")[0];
        const counter = { value: 0 };
        const secondsAt = (ms: number) => SWEEP_START + (ms / TRACE_DURATION_MS) * REPLAY_SECONDS;
        const sweepEnd = SWEEP_START + REPLAY_SECONDS;

        const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.out" } });

        tl.set(rows, { opacity: 0, y: 10 })
          .set(bars, { scaleX: 0 })
          .set(playhead, { left: "0%", autoAlpha: 1 })
          .set(scoring, { autoAlpha: 1 })
          .set(verdict, { autoAlpha: 0, scale: 0.94 })
          .set(findingRows, { autoAlpha: 0, x: 8 })
          .call(() => {
            if (confidence) confidence.textContent = "0.00";
          })
          .to(playhead, { left: "100%", duration: REPLAY_SECONDS, ease: "none" }, SWEEP_START);

        traceSpans.forEach((span, index) => {
          const at = secondsAt(span.startMs);
          const row = rows[index];
          const bar = bars[index];
          if (!row || !bar) return;
          tl.to(row, { opacity: 1, y: 0, duration: 0.45 }, at)
            .to(bar, { scaleX: 1, duration: Math.max(0.25, (span.durationMs / TRACE_DURATION_MS) * REPLAY_SECONDS) }, at);
          if (span.tone === "block") {
            tl.fromTo(row, { backgroundColor: "rgba(255,107,129,0)" }, { backgroundColor: "rgba(255,107,129,0.09)", duration: 0.4 }, at);
          }
        });

        tl.to(playhead, { autoAlpha: 0, duration: 0.3 }, sweepEnd)
          .to(scoring, { autoAlpha: 0, duration: 0.3 }, sweepEnd)
          .to(verdict, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, sweepEnd + 0.15)
          .to(
            counter,
            {
              value: CONFIDENCE,
              duration: 1.1,
              onUpdate: () => {
                if (confidence) confidence.textContent = counter.value.toFixed(2);
              },
            },
            sweepEnd + 0.2
          )
          .to(findingRows, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.12 }, sweepEnd + 0.35)
          .to([rows, verdict, findingRows], { opacity: 0, duration: 0.6, ease: "power2.in" }, sweepEnd + 5.2);

        return () => {
          tl.kill();
        };
      });
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      className="overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-faint">
          <span className="hidden sm:inline">Traces</span>
          <span aria-hidden className="hidden sm:inline">/</span>
          <span className="truncate text-ink">{TRACE_ID}</span>
          <span aria-hidden className="hidden text-line-strong md:inline">·</span>
          <span className="hidden md:inline">Procurement Agent · app-v2.4.1</span>
        </div>
        <div className="flex shrink-0 items-center gap-4 font-mono text-xs text-faint">
          <span className="flex items-center gap-2 text-pass">
            <span className="relative flex size-1.5">
              <span className="live-ping absolute inset-0 rounded-full bg-pass" />
              <span className="relative size-1.5 rounded-full bg-pass" />
            </span>
            Replay
          </span>
          <span className="tabular-nums">{TRACE_DURATION_MS.toLocaleString("en-US")} ms</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-4 sm:p-5">
          <div className="relative">
            <div className="grid grid-cols-[42%_58%] pb-2 font-mono text-[10px] uppercase tracking-widest text-faint sm:grid-cols-[40%_60%]">
              <span>Event</span>
              <span className="relative h-4">
                {AXIS_TICKS.map(tick => (
                  <span
                    key={tick}
                    className={cn("absolute tabular-nums", tick === 1 ? "right-0" : tick === 0 ? "left-0" : "-translate-x-1/2")}
                    style={tick === 0 || tick === 1 ? undefined : { left: `${tick * 100}%` }}
                  >
                    {Math.round(tick * TRACE_DURATION_MS)}
                  </span>
                ))}
              </span>
            </div>

            <div className="relative border-t border-line">
              <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[58%] sm:w-[60%]">
                {AXIS_TICKS.map(tick => (
                  <span key={tick} className="absolute inset-y-0 w-px bg-line/70" style={{ left: `${tick * 100}%` }} />
                ))}
                <span
                  data-playhead
                  className="absolute inset-y-0 z-10 w-px bg-ink/80 shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                  style={{ left: "100%", visibility: "hidden" }}
                />
              </div>

              <ol>
                {traceSpans.map(span => (
                  <li
                    key={span.id}
                    data-row
                    className="grid grid-cols-[42%_58%] items-center border-b border-line/60 py-3 last:border-b-0 sm:grid-cols-[40%_60%]"
                  >
                    <div className="min-w-0 pr-3">
                      <p className={cn("font-mono text-[10px] uppercase tracking-widest", kindTone[span.tone])}>
                        {span.kind}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-ink">{span.label}</p>
                      <p className="mt-0.5 hidden truncate font-mono text-[11px] text-faint sm:block">{span.detail}</p>
                    </div>
                    <div className="relative h-2">
                      <span
                        data-bar
                        className={cn("absolute top-0 h-2 origin-left rounded-full", barTone[span.tone])}
                        style={
                          span.startMs >= TRACE_DURATION_MS
                            ? { right: 0, width: "8px" }
                            : { left: `${percentOf(span.startMs)}%`, width: `max(${percentOf(span.durationMs)}%, 8px)` }
                        }
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-faint">
            <span className="text-review">Missing: Tier-2 approval event</span>
            <span aria-hidden>→</span>
            <span>tool proposed anyway</span>
            <span aria-hidden>→</span>
            <span className="text-block">blocked, then claimed as done</span>
          </p>
        </div>

        <aside className="border-t border-line p-4 sm:p-5 lg:border-l lg:border-t-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-faint">Machine decision</p>

          <div className="relative mt-4 h-[132px] rounded-xl border border-line bg-canvas/60">
            <div data-scoring className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ visibility: "hidden" }}>
              <span className="size-6 animate-spin rounded-full border border-line-strong border-t-ink" />
              <span className="font-mono text-[11px] text-faint">Running 6 evaluators…</span>
            </div>
            <div data-verdict className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <DecisionBadge decision="BLOCK" size="lg" />
              <p className="font-mono text-[11px] text-faint">
                confidence <span data-confidence className="text-ink tabular-nums">{CONFIDENCE.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-faint">Policy findings</p>
          <ul className="mt-3 space-y-2">
            {findings.map(finding => (
              <li key={finding.id} data-finding className="rounded-lg border border-line bg-canvas/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-ink">{finding.id}</span>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-wider",
                      finding.level === "critical" ? "text-block" : "text-review"
                    )}
                  >
                    {finding.level}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-faint">{finding.rule}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 font-mono text-[11px] text-faint sm:px-5">
        <span>7 events · 3 of 6 evaluators failed</span>
        <span className="flex items-center gap-2 text-pass">
          <span aria-hidden className="size-1.5 rounded-full bg-pass" />
          trace integrity verified
        </span>
      </div>
    </div>
  );
};
