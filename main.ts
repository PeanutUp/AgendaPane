import { Notice, Plugin } from "obsidian";
import { getNextOccurrence, isDateKey } from "./src/date-utils";
import { getStrings } from "./src/i18n";
import { ConfirmDeleteModal, TaskModal } from "./src/modals";
import { DayTaskSettingTab } from "./src/settings";
import {
  DEFAULT_DATA,
  DEFAULT_RECURRENCE,
  DEFAULT_SETTINGS,
  DayTaskData,
  DayTaskItem,
  DayTaskSettings,
  RecurrenceFrequency,
  RecurrenceRule,
  RecurrenceUnit,
  TaskDraft,
  TaskPriority,
} from "./src/types";
import { DayTaskView, VIEW_TYPE_DAYTASK } from "./src/view";

export default class DayTaskPlugin extends Plugin {
  data: DayTaskData = structuredClone(DEFAULT_DATA);
  private saveQueue: Promise<void> = Promise.resolve();

  async onload(): Promise<void> {
    await this.loadPluginData();

    this.registerView(VIEW_TYPE_DAYTASK, (leaf) => new DayTaskView(leaf, this));

    const strings = getStrings();
    this.addRibbonIcon("calendar-check-2", strings.open, () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-daytask",
      name: strings.open,
      callback: () => void this.activateView(),
    });

    this.addCommand({
      id: "add-task-today",
      name: strings.addTask,
      callback: async () => {
        const view = await this.activateView();
        view?.selectToday();
        window.setTimeout(() => view?.focusTaskInput(), 0);
      },
    });

    this.addSettingTab(new DayTaskSettingTab(this.app, this));
  }

  async onunload(): Promise<void> {
    await this.saveQueue;
  }

  async activateView(): Promise<DayTaskView | null> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAYTASK)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_DAYTASK, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    return leaf.view instanceof DayTaskView ? leaf.view : null;
  }

  getTasksForDate(date: string): DayTaskItem[] {
    const priorityRank: Record<TaskPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
      none: 3,
    };
    return this.data.tasks
      .filter((task) => task.date === date)
      .sort((left, right) => {
        if (left.completed !== right.completed) return Number(left.completed) - Number(right.completed);
        if (left.time !== right.time) {
          if (!left.time) return 1;
          if (!right.time) return -1;
          return left.time.localeCompare(right.time);
        }
        if (left.priority !== right.priority) {
          return priorityRank[left.priority] - priorityRank[right.priority];
        }
        return left.createdAt - right.createdAt;
      });
  }

  async addTask(title: string, date: string): Promise<void> {
    await this.addTaskFromDraft({
      title: title.trim(),
      date,
      time: "",
      priority: "none",
      notes: "",
      recurrence: { ...DEFAULT_RECURRENCE },
    });
  }

  async addTaskFromDraft(draft: TaskDraft): Promise<void> {
    if (!draft.title.trim() || !isDateKey(draft.date)) return;
    this.data.tasks.push(this.createTask(draft));
    await this.persistData();
    this.refreshViews();
  }

  async setTaskCompleted(id: string, completed: boolean): Promise<void> {
    const task = this.data.tasks.find((candidate) => candidate.id === id);
    if (!task) return;
    const wasCompleted = task.completed;
    task.completed = completed;
    task.updatedAt = Date.now();
    if (!wasCompleted && completed) this.generateNextOccurrence(task);
    await this.persistData();
    this.refreshViews();
  }

  async updateTask(id: string, draft: TaskDraft): Promise<void> {
    const task = this.data.tasks.find((candidate) => candidate.id === id);
    if (!task || !draft.title.trim() || !isDateKey(draft.date)) return;
    const recurrenceChanged =
      task.date !== draft.date ||
      task.recurrence.frequency !== draft.recurrence.frequency ||
      task.recurrence.interval !== draft.recurrence.interval ||
      task.recurrence.unit !== draft.recurrence.unit;
    task.title = draft.title.trim();
    task.date = draft.date;
    task.time = this.normalizeTime(draft.time);
    task.priority = this.normalizePriority(draft.priority);
    task.notes = draft.notes.trim();
    task.recurrence = this.normalizeRecurrence(
      recurrenceChanged ? { ...draft.recurrence, anchorDate: draft.date } : draft.recurrence,
      draft.date,
    );
    task.updatedAt = Date.now();
    await this.persistData();
    this.refreshViews();
  }

  async deleteTask(id: string): Promise<void> {
    const initialLength = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((task) => task.id !== id);
    if (this.data.tasks.length === initialLength) return;
    await this.persistData();
    this.refreshViews();
  }

  openEditModal(task: DayTaskItem): void {
    new TaskModal(this.app, this.taskToDraft(task), "edit", getStrings(), (draft) =>
      this.updateTask(task.id, draft),
    ).open();
  }

  openCreateModal(date: string): void {
    new TaskModal(
      this.app,
      {
        title: "",
        date,
        time: "",
        priority: "none",
        notes: "",
        recurrence: { ...DEFAULT_RECURRENCE },
      },
      "create",
      getStrings(),
      (draft) => this.addTaskFromDraft(draft),
    ).open();
  }

  requestDeleteTask(task: DayTaskItem): void {
    if (!this.data.settings.confirmBeforeDelete) {
      void this.deleteTask(task.id);
      return;
    }
    new ConfirmDeleteModal(this.app, getStrings(), () => this.deleteTask(task.id)).open();
  }

  refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_DAYTASK)) {
      if (leaf.view instanceof DayTaskView) leaf.view.render();
    }
  }

  persistData(): Promise<void> {
    const snapshot = structuredClone(this.data);
    this.saveQueue = this.saveQueue
      .catch(() => undefined)
      .then(() => this.saveData(snapshot))
      .catch((error: unknown) => {
        new Notice(`DayTask: ${error instanceof Error ? error.message : String(error)}`);
      });
    return this.saveQueue;
  }

  private async loadPluginData(): Promise<void> {
    const raw: unknown = await this.loadData();
    if (!raw || typeof raw !== "object") {
      this.data = structuredClone(DEFAULT_DATA);
      return;
    }

    const record = raw as Record<string, unknown>;
    const rawTasks = Array.isArray(record.tasks) ? record.tasks : [];
    const settings = this.normalizeSettings(record.settings);

    this.data = {
      schemaVersion: 2,
      settings,
      tasks: rawTasks.flatMap((candidate, index) => {
        const task = this.normalizeTask(candidate, index);
        return task ? [task] : [];
      }),
    };
  }

  private normalizeSettings(value: unknown): DayTaskSettings {
    if (!value || typeof value !== "object") return { ...DEFAULT_SETTINGS };
    const settings = value as Record<string, unknown>;
    return {
      weekStartsOnMonday:
        typeof settings.weekStartsOnMonday === "boolean"
          ? settings.weekStartsOnMonday
          : DEFAULT_SETTINGS.weekStartsOnMonday,
      confirmBeforeDelete:
        typeof settings.confirmBeforeDelete === "boolean"
          ? settings.confirmBeforeDelete
          : DEFAULT_SETTINGS.confirmBeforeDelete,
    };
  }

  private normalizeTask(value: unknown, index: number): DayTaskItem | null {
    if (!value || typeof value !== "object") return null;
    const task = value as Record<string, unknown>;
    if (typeof task.title !== "string" || !task.title.trim() || !isDateKey(task.date)) return null;
    const createdAt = typeof task.createdAt === "number" ? task.createdAt : Date.now() + index;
    return {
      id: typeof task.id === "string" && task.id ? task.id : this.createTaskId(),
      title: task.title.trim(),
      date: task.date,
      time: this.normalizeTime(task.time),
      completed: task.completed === true,
      priority: this.normalizePriority(task.priority),
      notes: typeof task.notes === "string" ? task.notes.trim() : "",
      recurrence: this.normalizeRecurrence(task.recurrence, task.date),
      ...(typeof task.generatedFromId === "string" && task.generatedFromId
        ? { generatedFromId: task.generatedFromId }
        : {}),
      createdAt,
      updatedAt: typeof task.updatedAt === "number" ? task.updatedAt : createdAt,
    };
  }

  private createTaskId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private createTask(draft: TaskDraft, generatedFromId?: string): DayTaskItem {
    const now = Date.now();
    return {
      id: this.createTaskId(),
      title: draft.title.trim(),
      date: draft.date,
      time: this.normalizeTime(draft.time),
      completed: false,
      priority: this.normalizePriority(draft.priority),
      notes: draft.notes.trim(),
      recurrence: this.normalizeRecurrence(draft.recurrence, draft.date),
      ...(generatedFromId ? { generatedFromId } : {}),
      createdAt: now,
      updatedAt: now,
    };
  }

  private taskToDraft(task: DayTaskItem): TaskDraft {
    return {
      title: task.title,
      date: task.date,
      time: task.time,
      priority: task.priority,
      notes: task.notes,
      recurrence: structuredClone(task.recurrence),
    };
  }

  private generateNextOccurrence(task: DayTaskItem): void {
    if (task.recurrence.frequency === "none") return;
    if (this.data.tasks.some((candidate) => candidate.generatedFromId === task.id)) return;
    const nextDate = getNextOccurrence(task.date, task.recurrence);
    if (!nextDate) return;
    this.data.tasks.push(
      this.createTask(
        {
          ...this.taskToDraft(task),
          date: nextDate,
        },
        task.id,
      ),
    );
  }

  private normalizeTime(value: unknown): string {
    return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "";
  }

  private normalizePriority(value: unknown): TaskPriority {
    return value === "low" || value === "medium" || value === "high" ? value : "none";
  }

  private normalizeRecurrence(value: unknown, fallbackAnchorDate?: string): RecurrenceRule {
    if (!value || typeof value !== "object") return { ...DEFAULT_RECURRENCE };
    const rule = value as Record<string, unknown>;
    const frequencies: RecurrenceFrequency[] = [
      "none",
      "daily",
      "weekdays",
      "weekly",
      "monthly",
      "yearly",
      "custom",
    ];
    const units: RecurrenceUnit[] = ["day", "week", "month", "year"];
    const frequency = frequencies.includes(rule.frequency as RecurrenceFrequency)
      ? (rule.frequency as RecurrenceFrequency)
      : "none";
    const unit = units.includes(rule.unit as RecurrenceUnit)
      ? (rule.unit as RecurrenceUnit)
      : "day";
    const rawInterval = typeof rule.interval === "number" ? Math.trunc(rule.interval) : 1;
    const anchorDate = isDateKey(rule.anchorDate)
      ? rule.anchorDate
      : isDateKey(fallbackAnchorDate)
        ? fallbackAnchorDate
        : undefined;
    return {
      frequency,
      unit,
      interval: Math.max(1, Math.min(999, rawInterval || 1)),
      ...(anchorDate ? { anchorDate } : {}),
    };
  }
}
