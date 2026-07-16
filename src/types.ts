export interface DayTaskItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  priority: TaskPriority;
  notes: string;
  recurrence: RecurrenceRule;
  generatedFromId?: string;
  seriesId?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export type TaskPriority = "none" | "low" | "medium" | "high";

export type RecurrenceFrequency =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type RecurrenceUnit = "day" | "week" | "month" | "year";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  unit: RecurrenceUnit;
  anchorDate?: string;
  untilDate?: string;
}

export interface TaskDraft {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  notes: string;
  recurrence: RecurrenceRule;
}

export interface DayTaskSettings {
  weekStartsOnMonday: boolean;
}

export interface DayTaskData {
  schemaVersion: number;
  tasks: DayTaskItem[];
  settings: DayTaskSettings;
  excludedOccurrences: string[];
  manualOrderDates: string[];
}

export const DEFAULT_SETTINGS: DayTaskSettings = {
  weekStartsOnMonday: true,
};

export const DEFAULT_RECURRENCE: RecurrenceRule = {
  frequency: "none",
  interval: 1,
  unit: "day",
};

export const DEFAULT_DATA: DayTaskData = {
  schemaVersion: 5,
  tasks: [],
  settings: DEFAULT_SETTINGS,
  excludedOccurrences: [],
  manualOrderDates: [],
};
