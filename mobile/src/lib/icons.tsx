import {
  Activity,
  Bike,
  BookOpen,
  Clock,
  Coffee,
  Dumbbell,
  Flag,
  Flame,
  FolderKanban,
  Footprints,
  Heart,
  Leaf,
  Medal,
  Moon,
  Mountain,
  Music,
  Repeat,
  Sparkles,
  Sun,
  Target,
  Timer,
  Trophy,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react-native";

const ICONS: Record<string, LucideIcon> = {
  "folder-kanban": FolderKanban,
  folderkanban: FolderKanban,
  dumbbell: Dumbbell,
  flame: Flame,
  bike: Bike,
  footprints: Footprints,
  activity: Activity,
  heart: Heart,
  timer: Timer,
  clock: Clock,
  repeat: Repeat,
  target: Target,
  trophy: Trophy,
  medal: Medal,
  flag: Flag,
  zap: Zap,
  sparkles: Sparkles,
  "book-open": BookOpen,
  bookopen: BookOpen,
  music: Music,
  coffee: Coffee,
  leaf: Leaf,
  sun: Sun,
  moon: Moon,
  mountain: Mountain,
  waves: Waves,
};

export const FEATURED_ICON_NAMES = Object.keys(ICONS);

export function toKebabCase(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export function EntityIcon({
  name,
  size = 18,
  color = "#6a89a7",
}: {
  name?: string | null;
  size?: number;
  color?: string;
}) {
  const key = name ? (name.includes("-") ? name.toLowerCase() : toKebabCase(name)) : "";
  const Icon = ICONS[key] ?? FolderKanban;
  return <Icon size={size} color={color} />;
}
