"use client";

import { StateNotice } from "@/components/ui/state-notice";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage = ({ error, reset }: ErrorPageProps) => (
  <StateNotice
    kind="unavailable"
    title="This screen could not be loaded"
    action={
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-line-strong px-3 py-1.5 text-sm text-ink hover:bg-raised"
      >
        Try again
      </button>
    }
  >
    The platform API did not return usable data. Your investigation context is
    unchanged.
    {error.digest && (
      <span className="mt-1 block font-mono text-xs text-faint">
        Reference {error.digest}
      </span>
    )}
  </StateNotice>
);

export default ErrorPage;
