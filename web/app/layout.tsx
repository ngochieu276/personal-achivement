import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/Providers";
import { siteUrl } from "@/lib/site";
import "@/index.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const site = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Personal Record — Finish the period",
    template: "%s · Personal Record",
  },
  description:
    "Track personal KPIs by project and subject. Log minutes or reps for the current period. When a cycle ends, Personal Record writes finish or miss and keeps your streak honest.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Personal Record — Finish the period",
    description:
      "A personal KPI ledger for time and reps. Rolling periods, finish or miss, streaks, and a day-by-day activity log.",
    url: site,
    siteName: "Personal Record",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Record — Finish the period",
    description: "Track personal KPIs by project and subject. Finish the period. Don't forget it.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${fraunces.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
