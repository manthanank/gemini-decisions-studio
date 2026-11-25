import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gemini Decisions Studio | gemini-decision-1 Workbench",
  description:
    "Interactive multimodal decision workbench, probability calibrator, and deterministic routing engine powered by the Gemini Decisions API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased selection:bg-sky-500/30 selection:text-sky-100">
        {children}
      </body>
    </html>
  );
}
