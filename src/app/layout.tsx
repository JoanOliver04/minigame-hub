import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppHeader } from "@/components/hub/AppHeader";
import { LocaleProvider } from "@/context/LocaleContext";
import { ScoresProvider } from "@/context/ScoresContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://minigame-hub-orcin.vercel.app"),
  title: "Mini-Game Hub — You vs AI",
  description: "A hub of mini-games where you battle a scheming AI opponent.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Mini-Game Hub — You vs AI",
    description: "A hub of mini-games where you battle a scheming AI opponent.",
    url: "/",
    siteName: "Mini-Game Hub",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "Mini-Game Hub logo" }],
    type: "website",
  },
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
        <Analytics />
      </body>
    </html>
  );
}
