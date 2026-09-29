"use client";

import { GetStartedLink, SignInLink } from "@/components/landing/AppLink";
import { ProductMock } from "@/components/landing/ProductMock";
import { motion, useReducedMotion } from "motion/react";

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
      <div>
        <motion.p
          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          Personal KPI ledger
        </motion.p>
        <motion.h1
          className="mt-3 font-serif text-4xl leading-tight md:text-6xl"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          Finish the period. Don&apos;t forget it.
        </motion.h1>
        <motion.p
          className="mt-5 max-w-md text-lg text-muted-foreground"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
        >
          Groups, projects, and subjects. Log minutes or reps for this day, week, two weeks, or month.
          When the cycle ends, Personal Record writes finish or miss — and keeps the streak honest.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
        >
          <GetStartedLink className="h-11 px-5" />
          <SignInLink className="h-11 px-5" />
        </motion.div>
      </div>
      <ProductMock />
    </section>
  );
}
