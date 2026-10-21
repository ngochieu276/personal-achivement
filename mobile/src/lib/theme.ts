export const colors = {
  background: "#e6f0f9",
  foreground: "#384959",
  card: "#f7fbff",
  muted: "#d5e8f8",
  mutedForeground: "#6a89a7",
  border: "#88bdf2",
  primary: "#384959",
  primaryForeground: "#f7fbff",
  secondary: "#6a89a7",
  accent: "#88bdf2",
  destructive: "#8f3d4a",
  hit: "#22c55e",
  progress: "#3b82f6",
  streak: "#f97316",
  miss: "#8f3d4a",
};

export const PROJECT_TONES = [
  { bg: "#6a89a733", border: "#6a89a7" },
  { bg: "#f9731626", border: "#f97316" },
  { bg: "#8f3d4a26", border: "#8f3d4a" },
  { bg: "#38495926", border: "#384959" },
];

export function projectTone(projectId: string) {
  let hash = 0;
  for (const char of projectId) hash = (hash + char.charCodeAt(0)) % PROJECT_TONES.length;
  return PROJECT_TONES[hash];
}
