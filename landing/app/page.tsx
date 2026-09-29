import { FeatureBento } from "@/components/FeatureBento";
import { FinalCta } from "@/components/FinalCta";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsStrip } from "@/components/StatsStrip";

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
