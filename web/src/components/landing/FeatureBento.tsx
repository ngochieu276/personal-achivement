"use client";

import { Reveal } from "@/components/landing/Reveal";
import { MiniTimeline } from "@/components/landing/MiniTimeline";
import { FolderKanban, History, CalendarRange, Flame, Paperclip } from "lucide-react";
import type { ReactNode } from "react";

const tiles: {
  title: string;
  body: string;
  icon: typeof FolderKanban;
  className?: string;
  extra?: ReactNode;
}[] = [
  {
    title: "Groups to subjects",
    body: "One person, many projects. Each subject has its own KPI, period, and streak.",
    icon: FolderKanban,
    className: "md:col-span-2",
  },
  {
    title: "Finish or miss",
    body: "When a cycle ends, the period is closed. Progress at or above KPI finishes. Anything less is a miss.",
    icon: Flame,
  },
  {
    title: "Catch a forgotten fill",
    body: "The subject timeline lists closed periods so you can edit KPI or logged progress after the fact.",
    icon: CalendarRange,
    extra: <MiniTimeline />,
  },
  {
    title: "Activity by day",
    body: "A single feed of KPI progress, newest first, with week and month windows.",
    icon: History,
  },
  {
    title: "Files on the subject",
    body: "Keep images, PDFs, and sheets next to records — preview, download, or delete.",
    icon: Paperclip,
    className: "md:col-span-2",
  },
];

export function FeatureBento() {
  return (
    <section id="product" className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Product</p>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl">Built around the period you are in.</h2>
      </Reveal>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {tiles.map((tile, index) => (
          <Reveal key={tile.title} delay={index * 0.06} className={tile.className}>
            <article className="h-full rounded-xl border bg-card p-5">
              <tile.icon className="h-5 w-5 text-secondary" />
              <h3 className="mt-3 font-medium">{tile.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tile.body}</p>
              {tile.extra}
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
