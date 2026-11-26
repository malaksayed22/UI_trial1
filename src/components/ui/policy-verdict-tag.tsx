import { AlertOctagon, Ban, CheckCircle2, CircleSlash } from "lucide-react";
import { policySecurityMeaning, policySecurityText } from "@/lib/labels";
import type { PolicySecurityVerdict } from "@/types";
import { Tag, type TagTone } from "./tag";

const view = {
  PASS: { tone: "pass", icon: CheckCircle2 },
  BLOCK: { tone: "block", icon: Ban },
  NOT_APPLICABLE: { tone: "neutral", icon: CircleSlash },
  UNAVAILABLE: { tone: "review", icon: AlertOctagon },
} as const satisfies Record<PolicySecurityVerdict, { tone: TagTone; icon: typeof Ban }>;

type PolicyVerdictTagProps = { verdict: PolicySecurityVerdict };

/**
 * Passed, not applicable and could-not-run are three different statements, so
 * each gets its own icon and wording. UNAVAILABLE is never shown as a pass.
 */
export const PolicyVerdictTag = ({ verdict }: PolicyVerdictTagProps) => (
  <Tag
    tone={view[verdict].tone}
    icon={view[verdict].icon}
    title={policySecurityMeaning[verdict]}
  >
    {policySecurityText[verdict]}
  </Tag>
);
