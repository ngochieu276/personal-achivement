"use client";

import { AnimatedProgress } from "@/components/landing/AnimatedProgress";
import { motion, useReducedMotion } from "motion/react";
import { Flame, Star } from "lucide-react";

export function ProductMock() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="rounded-xl border bg-card p-5 shadow-lg"
      initial={reduced ? false : { opacity: 0, y: 28, rotate: 1.5 }}
      animate={reduced ? undefined : { opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 fill-streak text-streak" />
        <p className="font-medium">Morning run</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Per week · 150 min</p>
      <div className="mt-5 space-y-3">
        <AnimatedProgress />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Log this period</span>
          <span className="inline-flex items-center gap-1">
            <motion.span
              animate={reduced ? undefined : { scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame className="h-4 w-4 fill-streak text-streak" />
            </motion.span>
            12 streak
          </span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border bg-muted/60 px-3 py-2">
          <p className="text-muted-foreground">Status</p>
          <p className="mt-1 font-medium text-hit">On track to finish</p>
        </div>
        <div className="rounded-md border bg-muted/60 px-3 py-2">
          <p className="text-muted-foreground">Cycle</p>
          <p className="mt-1 font-medium">3d left</p>
        </div>
      </div>
    </motion.div>
  );
}
