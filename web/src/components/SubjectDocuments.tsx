import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ResourceLink } from "@/components/ResourceLink";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { youtubeVideoId } from "@/lib/youtube";

export function SubjectDocuments({
  documents,
  pending,
  error,
  onChange,
}: {
  documents: string[];
  pending: boolean;
  error?: string;
  onChange: (documents: string[]) => void;
}) {
  const [url, setUrl] = useState("");

  function addDocument(event: FormEvent) {
    event.preventDefault();
    const next = url.trim();
    if (!next || documents.includes(next)) return;
    onChange([...documents, next]);
    setUrl("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Links and videos for this subject. YouTube URLs play here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex items-end gap-3" onSubmit={addDocument}>
          <Input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
            aria-label="Document URL"
          />
          <Button type="submit" disabled={pending || !url.trim()}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          <ul className="space-y-4">
            {documents.map((document) => (
              <DocumentItem
                key={document}
                url={document}
                pending={pending}
                onRemove={() => onChange(documents.filter((item) => item !== document))}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentItem({
  url,
  pending,
  onRemove,
}: {
  url: string;
  pending: boolean;
  onRemove: () => void;
}) {
  const isYouTube = Boolean(youtubeVideoId(url));

  return (
    <li className="space-y-2 rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm">{url}</p>
          <ResourceLink href={url} variant="full" />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onRemove}
          disabled={pending}
          aria-label={`Remove ${url}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {isYouTube ? <YouTubePlayer url={url} /> : null}
    </li>
  );
}
