export interface DayTaskItem {
  id: string;
  title: string;
  date: string;
  time: string;
  completed: boolean;
  priority: TaskPriority;
  notes: string;
  recurrence: RecurrenceRule;
  generatedFromId?: string;
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
}

export interface TaskDraft {
  title: string;
  date: string;
  time: string;
  priority: TaskPriority;
  notes: string;
  recurrence: RecurrenceRule;
}

export interface DayTaskSettings {
  weekStartsOnMonday: boolean;
  confirmBeforeDelete: boolean;
}

export interface DayTaskData {
  schemaVersion: number;
  tasks: DayTaskItem[];
  settings: DayTaskSettings;
}

export const DEFAULT_SETTINGS: DayTaskSettings = {
  weekStartsOnMonday: true,
  confirmBeforeDelete: true,
};

export const DEFAULT_RECURRENCE: RecurrenceRule = {
  frequency: "none",
  interval: 1,
  unit: "day",
};

export const DEFAULT_DATA: DayTaskData = {
  schemaVersion: 2,
  tasks: [],
  settings: DEFAULT_SETTINGS,
};
