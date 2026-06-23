import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { AlertWatcher } from "@/components/AlertWatcher";

export const metadata: Metadata = {
  title: "ShareForecast — Stock forecasts & watchlists",
  description:
    "Track stocks, build watchlists with alerts, and view 7-day forecasts combining statistical modeling with AI news analysis. Not financial advice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          <AlertWatcher />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-zinc-500">
            Data: Yahoo Finance (delayed ~15 min). Forecasts are statistical
            estimates and may be wrong. <strong>Not financial advice.</strong>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
