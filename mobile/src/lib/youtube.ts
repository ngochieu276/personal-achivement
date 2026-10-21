const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
]);

function hostName(url: URL) {
  return url.hostname.replace(/^www\./, "");
}

export function youtubeVideoId(value: string) {
  try {
    const url = new URL(value);
    if (!YOUTUBE_HOSTS.has(hostName(url))) return undefined;

    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery;

    const [kind, maybeId] = url.pathname.split("/").filter(Boolean);
    if (hostName(url) === "youtu.be") return kind;
    if (kind === "embed" || kind === "shorts" || kind === "live") return maybeId;
    return undefined;
  } catch {
    return undefined;
  }
}

export function youtubeEmbedUrl(value: string) {
  const id = youtubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
}
