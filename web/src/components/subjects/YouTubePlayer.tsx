"use client";

import { useI18n } from "@/i18n";
import { youtubeEmbedUrl } from "@/lib/youtube";

export function YouTubePlayer({ url }: { url: string }) {
  const { t } = useI18n();
  const src = youtubeEmbedUrl(url);
  if (!src) return null;

  return (
    <div className="overflow-hidden rounded-md border bg-muted">
      <iframe
        src={src}
        title={t("subjects.youtubeTitle")}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
