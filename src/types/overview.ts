import type { ApplicationId, Decision, VersionSet } from "./common";
import type { FailureLabel } from "./trace";
import type { GateSummary } from "./release";

export type DecisionCounts = Record<Decision, number>;

export type FailureClassCount = {
  label: Exclude<FailureLabel, "NORMAL">;
  count: number;
};

export type TrendPoint = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  counts: DecisionCounts;
};

export type ApplicationSummary = {
  id: ApplicationId;
  name: string;
  description: string;
  versions: VersionSet;
  traceCount: number;
  distribution: DecisionCounts;
  latestRun: {
    runId: string;
    completedAt: string;
    datasetVersion: string;
    evaluatorSetVersion: string;
  };
  recentGates: GateSummary[];
};

export type OverviewSummary = {
  windowDays: number;
  traceCount: number;
  distribution: DecisionCounts;
  failureClasses: FailureClassCount[];
  trend: TrendPoint[];
  applications: ApplicationSummary[];
  recentGates: GateSummary[];
};
