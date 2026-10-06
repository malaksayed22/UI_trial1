import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import type { GateConfiguration, VersionSet } from "@/types";

const components: { key: keyof VersionSet; label: string }[] = [
  { key: "application", label: "Application" },
  { key: "model", label: "Model" },
  { key: "prompt", label: "Prompt" },
  { key: "retriever", label: "Retriever" },
];

type ConfigurationProps = {
  title: string;
  configuration: GateConfiguration;
  /** Versions of the other side, used to flag what changed. */
  against?: VersionSet;
};

const Configuration = ({ title, configuration, against }: ConfigurationProps) => (
  <Panel aria-label={title}>
    <h3 className="font-mono text-xs uppercase tracking-wider text-faint">{title}</h3>
    <dl className="mt-3 space-y-2">
      {components.map(({ key, label }) => {
        const value = configuration.versions[key];
        const changed = against !== undefined && against[key] !== value;
        return (
          <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <dt className="w-24 text-xs text-faint">{label}</dt>
            <dd className="break-all font-mono text-sm text-ink">{value ?? "Not used"}</dd>
            {changed && <Tag tone="review">Changed</Tag>}
          </div>
        );
      })}
    </dl>
  </Panel>
);

type VersionComparisonProps = {
  baseline: GateConfiguration;
  candidate: GateConfiguration;
  datasetVersion: string;
  evaluatorSetVersion: string;
};

/** Both sides were evaluated on the same dataset and evaluator set. */
export const VersionComparison = ({
  baseline,
  candidate,
  datasetVersion,
  evaluatorSetVersion,
}: VersionComparisonProps) => (
  <section aria-labelledby="comparison-heading">
    <PanelHeader
      headingId="comparison-heading"
      title="Baseline versus candidate"
      subtitle={`Same dataset (${datasetVersion}) and evaluator set (${evaluatorSetVersion}) for both`}
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Configuration title="Approved baseline" configuration={baseline} />
      <Configuration
        title="Candidate"
        configuration={candidate}
        against={baseline.versions}
      />
    </div>
  </section>
);
