import { youtubeEmbedUrl } from "@/lib/youtube";

export function YouTubePlayer({ url }: { url: string }) {
  const src = youtubeEmbedUrl(url);
  if (!src) return null;

  return (
    <div className="overflow-hidden rounded-md border bg-muted">
      <iframe
        src={src}
        title="YouTube video"
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
