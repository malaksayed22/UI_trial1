"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { routes } from "@/lib/routes";

/**
 * Returns to the Trace Explorer with its filters intact when the reviewer
 * arrived from it; otherwise falls back to the unfiltered explorer.
 */
export const BackToExplorer = () => {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const cameFromExplorer =
      document.referrer !== "" &&
      new URL(document.referrer).origin === window.location.origin &&
      new URL(document.referrer).pathname === routes.traces;
    if (cameFromExplorer) {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={routes.traces}
      onClick={handleClick}
      className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      <ChevronLeft aria-hidden className="size-4" />
      Back to Trace Explorer
    </Link>
  );
};
