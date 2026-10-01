import type { ReactNode } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { api, dataSource } from "@/lib/api";
import { loadFeaturedTraces } from "@/lib/featured-traces";

// Role, permissions and trace shortcuts come from the backend on every request.
export const dynamic = "force-dynamic";

const loadViewer = async () => {
  try {
    return await api.getViewer();
  } catch {
    return null;
  }
};

const ConsoleLayout = async ({ children }: { children: ReactNode }) => {
  const [viewer, featured] = await Promise.all([loadViewer(), loadFeaturedTraces()]);
  return (
    <AppShell viewer={viewer} dataSource={dataSource} featured={featured}>
      {children}
    </AppShell>
  );
};

export default ConsoleLayout;
