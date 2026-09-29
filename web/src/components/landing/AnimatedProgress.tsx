"use client";

import { motion, useReducedMotion } from "motion/react";

export function AnimatedProgress() {
  const reduced = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-full bg-muted h-2">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: "28%", backgroundColor: "#3b82f6" }}
        animate={
          reduced
            ? { width: "100%", backgroundColor: "#22c55e" }
            : {
                width: ["28%", "72%", "100%", "100%", "28%"],
                backgroundColor: ["#3b82f6", "#3b82f6", "#22c55e", "#22c55e", "#3b82f6"],
              }
        }
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 5.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.45, 0.62, 0.82, 1] }
        }
      />
    </div>
  );
}
