export const HOUR_HEIGHT = 52;

const TONES = [
  "border-secondary/50 bg-secondary/20 text-foreground",
  "border-streak/40 bg-streak/15 text-foreground",
  "border-miss/40 bg-miss/15 text-foreground",
  "border-primary/40 bg-primary/15 text-foreground",
];

export function projectTone(projectId: string) {
  let hash = 0;
  for (const char of projectId) hash = (hash + char.charCodeAt(0)) % TONES.length;
  return TONES[hash];
}
