import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppHeader } from "@/components/hub/AppHeader";
import { LocaleProvider } from "@/context/LocaleContext";
import { ScoresProvider } from "@/context/ScoresContext";

export const metadata: Metadata = {
  title: "Mini-Game Hub — You vs AI",
  description: "A hub of mini-games where you battle a scheming AI opponent.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="app">
          <LocaleProvider>
            <AppHeader />
            <ScoresProvider>{children}</ScoresProvider>
          </LocaleProvider>
        </div>
      </body>
    </html>
  );
}
