"use client";

import { GetStartedLink } from "@/components/landing/AppLink";
import { Reveal } from "@/components/landing/Reveal";
import { useI18n } from "@/i18n";

export function FinalCta() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-xl border bg-card px-6 py-14 text-center">
          <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-streak/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-8 bottom-0 h-44 w-44 rounded-full bg-hit/25 blur-3xl" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("landing.ctaEyebrow")}</p>
          <h2 className="relative mt-3 font-serif text-3xl md:text-5xl">{t("landing.ctaTitle")}</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-muted-foreground">
            {t("landing.ctaBody")}
          </p>
          <div className="relative mt-8 flex justify-center">
            <GetStartedLink className="h-11 px-6" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
