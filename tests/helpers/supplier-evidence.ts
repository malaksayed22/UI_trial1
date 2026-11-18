import type { PolicyFinding, SupplierDirectoryEvent, TraceDetail, TraceEvent } from "@/types";

export const SUPPLIER_POLICY_ID = "PROC-SUPPLIER-01";

export const supplierFindingOf = (detail: TraceDetail): PolicyFinding | undefined =>
  detail.policyFindings.find(finding => finding.policyId === SUPPLIER_POLICY_ID);

const isSnapshot = (event: TraceEvent | undefined): event is SupplierDirectoryEvent =>
  event?.type === "supplier_directory_snapshot";

/**
 * Everything wrong with how one trace backs PROC-SUPPLIER-01 with evidence.
 * An empty list means the finding cites a supplier directory snapshot event
 * that holds the same supplier and version, agrees with the finding's outcome,
 * and was read before the policy check. A proposal event never counts.
 */
export const supplierEvidenceProblems = (detail: TraceDetail): string[] => {
  const finding = supplierFindingOf(detail);
  if (!finding) return [];

  const problems: string[] = [];
  const ref = finding.supplierRecordRef;
  const byId = new Map(detail.events.map(event => [event.eventId, event]));

  finding.evidenceEventIds.forEach(id => {
    const event = byId.get(id);
    if (event && !isSnapshot(event)) {
      problems.push(`evidence ${id} is a ${event.type} event, which cannot support a supplier status`);
    }
  });
  if (!finding.evidenceEventIds.some(id => isSnapshot(byId.get(id)))) {
    problems.push("no supplier directory snapshot among the finding's evidence events");
  }

  if (!ref) {
    problems.push("no supplier evidence recorded: the finding has no supplier record reference");
    return problems;
  }

  const event = byId.get(ref.eventId);
  if (!event) {
    problems.push(`evidence event ${ref.eventId} is not in the trace`);
    return problems;
  }
  if (!isSnapshot(event)) {
    problems.push(`${ref.eventId} is a ${event.type} event, not a supplier directory snapshot`);
    return problems;
  }
  if (!finding.evidenceEventIds.includes(ref.eventId)) {
    problems.push(`the referenced event ${ref.eventId} is not listed in the finding's evidence`);
  }

  const { lookup } = event;
  if (lookup.kind !== "record") {
    problems.push(`the lookup is ${lookup.kind}, so it holds no record to cite`);
    return problems;
  }

  const { record } = lookup;
  if (record.supplierId !== ref.supplierId) {
    problems.push(`supplier ID mismatch: finding ${ref.supplierId}, record ${record.supplierId}`);
  }
  if (record.recordVersion !== ref.recordVersion) {
    problems.push(`record version mismatch: finding ${ref.recordVersion}, record ${record.recordVersion}`);
  }
  if (!record.recordVersionSynthetic) problems.push("the record version is not marked synthetic");
  if (!record.source) problems.push("the record has no source");

  const expectedOutcome = record.status === "APPROVED" ? "pass" : "fail";
  if (finding.outcome !== expectedOutcome) {
    problems.push(`outcome ${finding.outcome} does not follow status ${record.status}`);
  }

  detail.actions.forEach(action => {
    const proposal = byId.get(action.proposal.eventId);
    if (proposal?.type === "tool_call") {
      const supplier = proposal.arguments.supplier;
      if (supplier && supplier !== record.supplierId) {
        problems.push(`the proposal names ${supplier} but the record is for ${record.supplierId}`);
      }
      if (event.sequence >= proposal.sequence) {
        problems.push("the supplier evidence is not before the proposal");
      }
    }
  });
  detail.events.forEach(other => {
    const isPolicyCheck =
      (other.type === "tool_result" && other.policyFindingIds.length > 0) ||
      (other.type === "agent_state" && (other.from === "policy_checked" || other.to === "policy_checked"));
    if (isPolicyCheck && event.sequence >= other.sequence) {
      problems.push(`the supplier evidence is not before the policy check at ${other.eventId}`);
    }
  });

  return problems;
};
