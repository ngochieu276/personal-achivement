"use client";

import { Reveal } from "@/components/landing/Reveal";
import { useI18n } from "@/i18n";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (latest) => setShown(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

export function StatsStrip() {
  const { t } = useI18n();
  const stats = [
    { value: 4, suffix: "", label: t("landing.statPeriods"), hint: t("landing.statPeriodsHint") },
    { value: 2, suffix: "", label: t("landing.statOutcomes"), hint: t("landing.statOutcomesHint") },
    { value: 1, suffix: "", label: t("landing.statStreak"), hint: t("landing.statStreakHint") },
    { value: 100, suffix: "%", label: t("landing.statLog"), hint: t("landing.statLogHint") },
  ];

  return (
    <section id="why" className="mx-auto max-w-6xl px-4 py-8">
      <Reveal>
        <div className="grid gap-4 rounded-xl border bg-card/80 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <motion.div key={stat.label} className="space-y-1">
              <p className="font-serif text-3xl">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm font-medium">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </motion.div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
