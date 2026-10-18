import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Access Lens — Understand what's working. Fix what isn't.",
  description:
    "Check a public web page for accessibility issues, explore real visual fixes, and save a report. Free, no account required.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
