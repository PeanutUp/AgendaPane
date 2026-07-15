export interface DayTaskStrings {
  viewName: string;
  open: string;
  previousMonth: string;
  nextMonth: string;
  today: string;
  tasks: string;
  addPlaceholder: string;
  addTask: string;
  advancedAdd: string;
  noTasks: string;
  noTasksHint: string;
  editTask: string;
  deleteTask: string;
  cancel: string;
  save: string;
  taskTitle: string;
  taskDate: string;
  taskTime: string;
  taskNotes: string;
  taskNotesPlaceholder: string;
  priority: string;
  priorityNone: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  recurrence: string;
  recurrenceNone: string;
  recurrenceDaily: string;
  recurrenceWeekdays: string;
  recurrenceWeekly: string;
  recurrenceMonthly: string;
  recurrenceYearly: string;
  recurrenceCustom: string;
  recurrenceEvery: string;
  unitDay: string;
  unitWeek: string;
  unitMonth: string;
  unitYear: string;
  createTask: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  delete: string;
  settingsWeekStart: string;
  settingsWeekStartDesc: string;
  settingsConfirmDelete: string;
  settingsConfirmDeleteDesc: string;
  incomplete: string;
  complete: string;
}

const EN: DayTaskStrings = {
  viewName: "DayTask",
  open: "Open DayTask",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  today: "Today",
  tasks: "tasks",
  addPlaceholder: "Add a task…",
  addTask: "Add task",
  advancedAdd: "Add with details",
  noTasks: "Nothing planned",
  noTasksHint: "Add a task for this day when you are ready.",
  editTask: "Edit task",
  deleteTask: "Delete task",
  cancel: "Cancel",
  save: "Save",
  taskTitle: "Task",
  taskDate: "Date",
  taskTime: "Time",
  taskNotes: "Notes",
  taskNotesPlaceholder: "Optional details…",
  priority: "Priority",
  priorityNone: "None",
  priorityLow: "Low",
  priorityMedium: "Medium",
  priorityHigh: "High",
  recurrence: "Repeat",
  recurrenceNone: "Does not repeat",
  recurrenceDaily: "Daily",
  recurrenceWeekdays: "Every weekday",
  recurrenceWeekly: "Weekly",
  recurrenceMonthly: "Monthly",
  recurrenceYearly: "Yearly",
  recurrenceCustom: "Custom…",
  recurrenceEvery: "Repeat every",
  unitDay: "day(s)",
  unitWeek: "week(s)",
  unitMonth: "month(s)",
  unitYear: "year(s)",
  createTask: "Create task",
  confirmDeleteTitle: "Delete task?",
  confirmDeleteMessage: "This task will be permanently removed from DayTask data.",
  delete: "Delete",
  settingsWeekStart: "Start week on Monday",
  settingsWeekStartDesc: "Show Monday as the first day in the calendar.",
  settingsConfirmDelete: "Confirm before deleting",
  settingsConfirmDeleteDesc: "Ask for confirmation before permanently deleting a task.",
  incomplete: "Mark incomplete",
  complete: "Mark complete",
};

const ZH: DayTaskStrings = {
  viewName: "DayTask",
  open: "打开 DayTask",
  previousMonth: "上个月",
  nextMonth: "下个月",
  today: "今天",
  tasks: "项任务",
  addPlaceholder: "添加任务…",
  addTask: "添加任务",
  advancedAdd: "添加详细任务",
  noTasks: "这一天还没有安排",
  noTasksHint: "准备好后，可以在上方添加任务。",
  editTask: "编辑任务",
  deleteTask: "删除任务",
  cancel: "取消",
  save: "保存",
  taskTitle: "任务",
  taskDate: "日期",
  taskTime: "时间",
  taskNotes: "备注",
  taskNotesPlaceholder: "可选的详细说明…",
  priority: "优先级",
  priorityNone: "无",
  priorityLow: "低",
  priorityMedium: "中",
  priorityHigh: "高",
  recurrence: "循环",
  recurrenceNone: "不循环",
  recurrenceDaily: "每天",
  recurrenceWeekdays: "每个工作日",
  recurrenceWeekly: "每周",
  recurrenceMonthly: "每月",
  recurrenceYearly: "每年",
  recurrenceCustom: "自定义…",
  recurrenceEvery: "每隔",
  unitDay: "天",
  unitWeek: "周",
  unitMonth: "个月",
  unitYear: "年",
  createTask: "新建任务",
  confirmDeleteTitle: "删除任务？",
  confirmDeleteMessage: "该任务将从 DayTask 数据中永久删除。",
  delete: "删除",
  settingsWeekStart: "每周从星期一开始",
  settingsWeekStartDesc: "将星期一显示为日历的第一天。",
  settingsConfirmDelete: "删除前确认",
  settingsConfirmDeleteDesc: "永久删除任务前先显示确认提示。",
  incomplete: "标记为未完成",
  complete: "标记为已完成",
};

export function getStrings(): DayTaskStrings {
  const language = document.documentElement.lang || navigator.language || "en";
  return language.toLowerCase().startsWith("zh") ? ZH : EN;
}
