import { FeatureBento } from "@/components/landing/FeatureBento";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { StatsStrip } from "@/components/landing/StatsStrip";

export default function HomePage() {
  return (
    <div id="top">
      <SiteHeader />
      <main>
        <Hero />
        <StatsStrip />
        <FeatureBento />
        <HowItWorks />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
