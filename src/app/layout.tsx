import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

/** Display serif, used only for editorial emphasis on the landing page. Self-hosted so the demo works offline. */
const serif = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TrustOps AI — Know what your AI actually did",
    template: "%s · TrustOps AI",
  },
  description:
    "Trace-based reliability, evaluation and governance for generative and agentic AI.",
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html
    lang="en"
    className={`${GeistSans.variable} ${GeistMono.variable} ${serif.variable}`}
  >
    <body>{children}</body>
  </html>
);

export default RootLayout;
