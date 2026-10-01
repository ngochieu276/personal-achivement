"use client";

import { Reveal } from "@/components/landing/Reveal";
import { useI18n } from "@/i18n";

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    {
      n: "01",
      title: t("landing.step1"),
      body: t("landing.step1Body"),
    },
    {
      n: "02",
      title: t("landing.step2"),
      body: t("landing.step2Body"),
    },
    {
      n: "03",
      title: t("landing.step3"),
      body: t("landing.step3Body"),
    },
  ];

  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("landing.how")}</p>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl">{t("landing.howTitle")}</h2>
      </Reveal>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <Reveal key={step.n} delay={index * 0.08}>
            <li className="relative rounded-xl border bg-card p-6">
              <p className="font-serif text-2xl text-streak">{step.n}</p>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
