"use client";

import { Reveal } from "@/components/Reveal";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 4, suffix: "", label: "Rolling periods", hint: "Day, week, two weeks, month" },
  { value: 2, suffix: "", label: "Period outcomes", hint: "Finish or miss, every cycle" },
  { value: 1, suffix: "", label: "Honest streak", hint: "Hits climb. Misses reset." },
  { value: 100, suffix: "%", label: "Your log", hint: "Activity by day, newest first" },
];

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
