import type { Metadata } from "next";
import { Landing } from "@/features/landing/landing";

export const metadata: Metadata = {
  title: { absolute: "TrustOps AI — Know what your AI actually did" },
};

const LandingPage = () => <Landing />;

export default LandingPage;
