"use client";

import { motion, useReducedMotion } from "motion/react";

const rows = [
  { label: "Sep 21 – Sep 28", status: "Finished" },
  { label: "Sep 14 – Sep 21", status: "Missed" },
  { label: "Sep 7 – Sep 14", status: "Finished" },
];

export function MiniTimeline() {
  const reduced = useReducedMotion();

  return (
    <ol className="mt-4 space-y-3">
      {rows.map((row, index) => (
        <motion.li
          key={row.label}
          className="flex items-center gap-3"
          initial={reduced ? false : { opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 * index, duration: 0.4 }}
        >
          <span
            className={
              row.status === "Finished"
                ? "size-2.5 shrink-0 rounded-full bg-hit"
                : "size-2.5 shrink-0 rounded-full bg-secondary"
            }
          />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{row.label}</span>
          <span className="text-xs font-medium">{row.status}</span>
        </motion.li>
      ))}
    </ol>
  );
}
