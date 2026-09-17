export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  subjectCount?: number;
};

export type KpiTypePeriod = "day" | "week" | "twoWeek" | "month";
export type KpiType = "totalTime" | "totalRepeat";
export type EventStatus = "miss" | "finish";
export type HistoryType = "streak_hit" | "kpi_change" | "subject_event";

export type PeriodWindow = {
  start: string;
  end: string;
  index: number;
};

export type Subject = {
  id: string;
  projectId: string;
  name: string;
  kpi: number;
  kpiTypePeriod: KpiTypePeriod;
  kpiType: KpiType;
  startDate: string;
  link: string | null;
  currentProgress: number;
  currentStreak: number;
  createdAt: string;
  activeWindow?: PeriodWindow;
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
