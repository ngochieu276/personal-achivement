"use client";

import { Reveal } from "@/components/Reveal";

const steps = [
  {
    n: "01",
    title: "Create a subject",
    body: "Pick time or reps, a period length, and a start date. Nest it under a project.",
  },
  {
    n: "02",
    title: "Log this period",
    body: "Set or add minutes and reps for the current cycle. The bar turns green when you finish.",
  },
  {
    n: "03",
    title: "Let the cycle close",
    body: "At period end, the API writes finish or miss, updates the streak, and keeps history.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">How it works</p>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl">Three moves, then the clock does the rest.</h2>
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
