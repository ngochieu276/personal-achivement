"use client";

import { Reveal } from "@/components/landing/Reveal";
import { MiniTimeline } from "@/components/landing/MiniTimeline";
import { useI18n } from "@/i18n";
import { FolderKanban, History, CalendarRange, Flame, Paperclip } from "lucide-react";
import type { ReactNode } from "react";

export function FeatureBento() {
  const { t } = useI18n();
  const tiles: {
    title: string;
    body: string;
    icon: typeof FolderKanban;
    className?: string;
    extra?: ReactNode;
  }[] = [
    {
      title: t("landing.tileGroups"),
      body: t("landing.tileGroupsBody"),
      icon: FolderKanban,
      className: "md:col-span-2",
    },
    {
      title: t("landing.tileFinish"),
      body: t("landing.tileFinishBody"),
      icon: Flame,
    },
    {
      title: t("landing.tileTimeline"),
      body: t("landing.tileTimelineBody"),
      icon: CalendarRange,
      extra: <MiniTimeline />,
    },
    {
      title: t("landing.tileActivity"),
      body: t("landing.tileActivityBody"),
      icon: History,
    },
    {
      title: t("landing.tileFiles"),
      body: t("landing.tileFilesBody"),
      icon: Paperclip,
      className: "md:col-span-2",
    },
  ];

  return (
    <section id="product" className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("landing.product")}</p>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl">{t("landing.productTitle")}</h2>
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
