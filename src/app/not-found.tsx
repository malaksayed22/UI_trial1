import Link from "next/link";
import { StateNotice } from "@/components/ui/state-notice";
import { routes } from "@/lib/routes";

const NotFound = () => (
  <StateNotice
    kind="not_found"
    title="Page not found"
    action={
      <Link href={routes.overview} className="text-sm text-info hover:underline">
        Back to overview
      </Link>
    }
  >
    This address is not one of the seven reliability screens.
  </StateNotice>
);

export default NotFound;
