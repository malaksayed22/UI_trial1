import Link from "next/link";
import type { ReactNode } from "react";
import type { ApiError, ApiErrorKind } from "@/lib/api/errors";
import { StateNotice, type StateKind } from "./state-notice";

const copy: Record<ApiErrorKind, { kind: StateKind; title: string }> = {
  not_found: { kind: "not_found", title: "Not available" },
  not_applicable: { kind: "not_applicable", title: "Not applicable" },
  forbidden: { kind: "forbidden", title: "Access denied" },
  invalid: { kind: "unavailable", title: "The request was not accepted" },
  unavailable: { kind: "unavailable", title: "Data is unavailable" },
};

type ApiErrorNoticeProps = {
  error: ApiError;
  back?: { href: string; label: string };
  children?: ReactNode;
};

/** Maps a stable API error to a consistent, recoverable on-screen state. */
export const ApiErrorNotice = ({ error, back, children }: ApiErrorNoticeProps) => {
  const { kind, title } = copy[error.kind];
  return (
    <StateNotice
      kind={kind}
      title={title}
      action={
        back && (
          <Link href={back.href} className="text-sm text-info hover:underline">
            {back.label}
          </Link>
        )
      }
    >
      {error.message}
      {children}
    </StateNotice>
  );
};
