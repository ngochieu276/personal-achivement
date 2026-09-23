export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type ProjectGroup = {
  id: string;
  name: string;
  icon?: string | null;
};

export type Project = {
  id: string;
  name: string;
  icon?: string | null;
  createdAt: string;
  subjectCount?: number;
  averageProgress?: number;
  groupIds?: string[];
  groups?: ProjectGroup[];
};

export type Group = {
  id: string;
  name: string;
  icon?: string | null;
  createdAt: string;
  projects: Project[];
};

export type GroupTree = {
  groups: Group[];
  ungrouped: Project[];
};

export type KpiTypePeriod = "day" | "week" | "twoWeek" | "month";
export type KpiType = "totalTime" | "totalRepeat";
export type TypeOfRecord = "timePerRep" | "repPerTime" | "maximum" | "fastest" | "defineByUser";
export type BetterDirection = "lowerIsBetter" | "higherIsBetter";
export type EventStatus = "miss" | "finish";
export type HistoryType = "streak_hit" | "kpi_change" | "subject_event" | "kpi_done";

export type PeriodWindow = {
  start: string;
  end: string;
  index: number;
};

export type Subject = {
  id: string;
  projectId: string;
  name: string;
  icon?: string | null;
  kpi: number;
  kpiTypePeriod: KpiTypePeriod;
  kpiType: KpiType;
  startDate: string;
  link: string | null;
  note: string | null;
  documents: string[];
  typeOfRecord: TypeOfRecord | null;
  betterDirection: BetterDirection | null;
  isPriority: boolean;
  currentProgress: number;
  currentStreak: number;
  createdAt: string;
  activeWindow?: PeriodWindow;
  records?: SubjectRecord[];
};

export type SubjectRecord = {
  id: string;
  subjectId: string;
  date: string;
  recordNumber: number;
  createdAt: string;
};

export type SubjectEvent = {
  id: string;
  subjectId: string;
  status: EventStatus;
  date: string;
  periodStart: string;
  periodEnd: string;
  progress: number;
  kpiSnapshot: number;
  createdAt: string;
};

export type SubjectHistory = {
  id: string;
  subjectId: string;
  type: HistoryType;
  subjectEventId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type SubjectDetail = {
  subject: Subject;
  activeWindow: PeriodWindow;
  events: SubjectEvent[];
  history: SubjectHistory[];
};

export type DashboardStats = {
  summary: {
    subjectCount: number;
    onTrack: number;
    atRisk: number;
    streakCount: number;
    averageProgress: number;
    hitRate: number | null;
  };
};
