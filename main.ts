import { Notice, Plugin } from "obsidian";
import { addDays, formatDateKey, getNextOccurrence, isDateKey } from "./src/date-utils";
import { getStrings } from "./src/i18n";
import { TaskModal } from "./src/modals";
import { AgendaPaneSettingTab } from "./src/settings";
import {
  DEFAULT_DATA,
  DEFAULT_RECURRENCE,
  DEFAULT_SETTINGS,
  AgendaPaneData,
  AgendaPaneItem,
  AgendaPaneSettings,
  RecurrenceFrequency,
  RecurrenceRule,
  RecurrenceUnit,
  TaskDraft,
  TaskPriority,
} from "./src/types";
import { AgendaPaneView, VIEW_TYPE_AGENDA_PANE } from "./src/view";

export default class AgendaPanePlugin extends Plugin {
  data: AgendaPaneData = structuredClone(DEFAULT_DATA);
  private saveQueue: Promise<void> = Promise.resolve();
  private needsMigrationSave = false;

  async onload(): Promise<void> {
    await this.loadPluginData();

    this.registerView(VIEW_TYPE_AGENDA_PANE, (leaf) => new AgendaPaneView(leaf, this));

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

    this.addSettingTab(new AgendaPaneSettingTab(this.app, this));

    const initializeWorkspace = (): void => {
      const expanded = this.expandAllRecurringSeries();
      if (expanded || this.needsMigrationSave) {
        this.needsMigrationSave = false;
        void this.persistData();
      }
      void this.activateView();
    };
    if (this.app.workspace.layoutReady) initializeWorkspace();
    else this.app.workspace.onLayoutReady(initializeWorkspace);
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_AGENDA_PANE);
    await this.saveQueue;
  }

  async activateView(): Promise<AgendaPaneView | null> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_AGENDA_PANE)[0];
    if (!leaf) {
      if (typeof this.app.workspace.ensureSideLeaf === "function") {
        leaf = await this.app.workspace.ensureSideLeaf(VIEW_TYPE_AGENDA_PANE, "right", {
          active: true,
          split: false,
          reveal: true,
        });
      } else {
        leaf = this.app.workspace.getRightLeaf(true) ?? this.app.workspace.getLeaf(true);
        await leaf.setViewState({ type: VIEW_TYPE_AGENDA_PANE, active: true });
      }
    }
    await this.app.workspace.revealLeaf(leaf);
    return leaf.view instanceof AgendaPaneView ? leaf.view : null;
  }

  getTasksForDate(date: string): AgendaPaneItem[] {
    const manual = this.data.manualOrderDates.includes(date);
    const priorityRank: Record<TaskPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
      none: 3,
    };
    return this.data.tasks
      .filter((task) => task.date === date)
      .sort((left, right) => {
        if (!manual) {
          if (Boolean(left.startTime) !== Boolean(right.startTime)) return left.startTime ? -1 : 1;
          if (left.startTime && right.startTime && left.startTime !== right.startTime) {
            return left.startTime.localeCompare(right.startTime);
          }
          if (left.priority !== right.priority) {
            return priorityRank[left.priority] - priorityRank[right.priority];
          }
        }
        if (left.order !== right.order) return left.order - right.order;
        return left.createdAt - right.createdAt;
      });
  }

  async reorderTask(sourceId: string, targetId: string, placeAfter: boolean): Promise<void> {
    if (sourceId === targetId) return;
    const source = this.data.tasks.find((task) => task.id === sourceId);
    const target = this.data.tasks.find((task) => task.id === targetId);
    if (!source || !target || source.date !== target.date) return;

    const ordered = this.getTasksForDate(source.date);
    const sourceIndex = ordered.findIndex((task) => task.id === sourceId);
    if (sourceIndex < 0) return;
    const [moved] = ordered.splice(sourceIndex, 1);
    let targetIndex = ordered.findIndex((task) => task.id === targetId);
    if (targetIndex < 0) return;
    if (placeAfter) targetIndex += 1;
    ordered.splice(targetIndex, 0, moved);
    ordered.forEach((task, index) => {
      task.order = index;
      task.updatedAt = Date.now();
    });
    if (!this.data.manualOrderDates.includes(source.date)) {
      this.data.manualOrderDates.push(source.date);
    }
    await this.persistData();
    this.refreshViews();
  }

  async moveTask(id: string, targetDate: string): Promise<boolean> {
    if (!isDateKey(targetDate)) return false;
    const task = this.data.tasks.find((candidate) => candidate.id === id);
    if (!task || task.date === targetDate) return false;

    const sourceDate = task.date;
    const targetOrder = this.nextOrderForDate(targetDate);
    if (task.seriesId) {
      const seriesId = task.seriesId;
      const key = this.occurrenceKey(seriesId, sourceDate);
      if (!this.data.excludedOccurrences.includes(key)) {
        this.data.excludedOccurrences.push(key);
      }
      // Keep the detached occurrence from reusing the original series identity.
      if (task.id === seriesId) task.id = this.createTaskId();
      task.recurrence = { ...DEFAULT_RECURRENCE };
      delete task.seriesId;
      delete task.generatedFromId;
    }

    task.date = targetDate;
    task.order = targetOrder;
    task.updatedAt = Date.now();

    if (!this.data.tasks.some((candidate) => candidate.date === sourceDate)) {
      this.data.manualOrderDates = this.data.manualOrderDates.filter(
        (date) => date !== sourceDate,
      );
    }

    await this.persistData();
    this.refreshViews();
    return true;
  }

  async addTask(title: string, date: string): Promise<void> {
    await this.addTaskFromDraft({
      title: title.trim(),
      date,
      startTime: "",
      endTime: "",
      priority: "none",
      notes: "",
      recurrence: { ...DEFAULT_RECURRENCE },
    });
  }

  async addTaskFromDraft(draft: TaskDraft): Promise<void> {
    if (!draft.title.trim() || !isDateKey(draft.date)) return;
    const task = this.createTask(draft);
    if (task.recurrence.frequency !== "none") task.seriesId = task.id;
    this.data.tasks.push(task);
    if (task.seriesId) this.expandRecurringSeries(task.seriesId);
    await this.persistData();
    this.refreshViews();
  }

  async setTaskCompleted(id: string, completed: boolean): Promise<void> {
    const task = this.data.tasks.find((candidate) => candidate.id === id);
    if (!task) return;
    task.completed = completed;
    task.updatedAt = Date.now();
    await this.persistData();
    this.refreshViews();
  }

  async updateTask(id: string, draft: TaskDraft): Promise<void> {
    const task = this.data.tasks.find((candidate) => candidate.id === id);
    if (!task || !draft.title.trim() || !isDateKey(draft.date)) return;
    const originalDate = task.date;
    const originalSeriesId = task.seriesId;
    const recurrenceChanged =
      task.date !== draft.date ||
      task.recurrence.frequency !== draft.recurrence.frequency ||
      task.recurrence.interval !== draft.recurrence.interval ||
      task.recurrence.unit !== draft.recurrence.unit ||
      task.recurrence.untilDate !== draft.recurrence.untilDate;
    task.title = draft.title.trim();
    task.date = draft.date;
    task.startTime = this.normalizeTime(draft.startTime);
    task.endTime = this.normalizeTime(draft.endTime);
    task.priority = this.normalizePriority(draft.priority);
    task.notes = draft.notes.trim();
    task.recurrence = this.normalizeRecurrence(
      recurrenceChanged ? { ...draft.recurrence, anchorDate: draft.date } : draft.recurrence,
      draft.date,
    );
    task.updatedAt = Date.now();

    if (originalSeriesId && task.recurrence.frequency === "none") {
      this.data.tasks = this.data.tasks.filter(
        (candidate) => candidate.id === task.id || candidate.seriesId !== originalSeriesId,
      );
      this.data.excludedOccurrences = this.data.excludedOccurrences.filter(
        (key) => !key.startsWith(`${originalSeriesId}@`),
      );
    } else if (originalSeriesId) {
      this.data.tasks = this.data.tasks.filter(
        (candidate) =>
          candidate.id === task.id ||
          candidate.seriesId !== originalSeriesId ||
          candidate.date < originalDate,
      );
      this.data.excludedOccurrences = this.data.excludedOccurrences.filter((key) => {
        if (!key.startsWith(`${originalSeriesId}@`)) return true;
        return key.slice(originalSeriesId.length + 1) < originalDate;
      });
    }

    if (task.recurrence.frequency === "none") {
      delete task.seriesId;
      delete task.generatedFromId;
    } else {
      task.seriesId = originalSeriesId ?? task.id;
      this.expandRecurringSeries(task.seriesId);
    }
    await this.persistData();
    this.refreshViews();
  }

  async deleteTask(id: string): Promise<void> {
    const task = this.data.tasks.find((candidate) => candidate.id === id);
    if (!task) return;
    if (task.seriesId) {
      const key = this.occurrenceKey(task.seriesId, task.date);
      if (!this.data.excludedOccurrences.includes(key)) this.data.excludedOccurrences.push(key);
    }
    const initialLength = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((task) => task.id !== id);
    if (this.data.tasks.length === initialLength) return;
    await this.persistData();
    this.refreshViews();
  }

  openEditModal(task: AgendaPaneItem): void {
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
        startTime: "",
        endTime: "",
        priority: "none",
        notes: "",
        recurrence: { ...DEFAULT_RECURRENCE },
      },
      "create",
      getStrings(),
      (draft) => this.addTaskFromDraft(draft),
    ).open();
  }

  refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_AGENDA_PANE)) {
      if (leaf.view instanceof AgendaPaneView) leaf.view.render();
    }
  }

  persistData(): Promise<void> {
    const snapshot = structuredClone(this.data);
    this.saveQueue = this.saveQueue
      .catch(() => undefined)
      .then(() => this.saveData(snapshot))
      .catch((error: unknown) => {
        new Notice(`AgendaPane: ${error instanceof Error ? error.message : String(error)}`);
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
    this.needsMigrationSave = record.schemaVersion !== 5;
    const rawTasks = Array.isArray(record.tasks) ? record.tasks : [];
    const settings = this.normalizeSettings(record.settings);

    this.data = {
      schemaVersion: 5,
      settings,
      excludedOccurrences: Array.isArray(record.excludedOccurrences)
        ? record.excludedOccurrences.filter((value): value is string => typeof value === "string")
        : [],
      manualOrderDates: Array.isArray(record.manualOrderDates)
        ? record.manualOrderDates.filter((value): value is string => isDateKey(value))
        : [],
      tasks: rawTasks.flatMap((candidate, index) => {
        const task = this.normalizeTask(candidate, index);
        return task ? [task] : [];
      }),
    };
    this.assignSeriesIds();
  }

  private normalizeSettings(value: unknown): AgendaPaneSettings {
    if (!value || typeof value !== "object") return { ...DEFAULT_SETTINGS };
    const settings = value as Record<string, unknown>;
    return {
      weekStartsOnMonday:
        typeof settings.weekStartsOnMonday === "boolean"
          ? settings.weekStartsOnMonday
          : DEFAULT_SETTINGS.weekStartsOnMonday,
    };
  }

  private normalizeTask(value: unknown, index: number): AgendaPaneItem | null {
    if (!value || typeof value !== "object") return null;
    const task = value as Record<string, unknown>;
    if (typeof task.title !== "string" || !task.title.trim() || !isDateKey(task.date)) return null;
    const createdAt = typeof task.createdAt === "number" ? task.createdAt : Date.now() + index;
    return {
      id: typeof task.id === "string" && task.id ? task.id : this.createTaskId(),
      title: task.title.trim(),
      date: task.date,
      startTime: this.normalizeTime(task.startTime ?? task.time),
      endTime: this.normalizeTime(task.endTime),
      completed: task.completed === true,
      priority: this.normalizePriority(task.priority),
      notes: typeof task.notes === "string" ? task.notes.trim() : "",
      recurrence: this.normalizeRecurrence(task.recurrence, task.date),
      ...(typeof task.generatedFromId === "string" && task.generatedFromId
        ? { generatedFromId: task.generatedFromId }
        : {}),
      ...(typeof task.seriesId === "string" && task.seriesId ? { seriesId: task.seriesId } : {}),
      order: typeof task.order === "number" && Number.isFinite(task.order) ? task.order : index,
      createdAt,
      updatedAt: typeof task.updatedAt === "number" ? task.updatedAt : createdAt,
    };
  }

  private createTaskId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private nextOrderForDate(date: string): number {
    const orders = this.data.tasks
      .filter((task) => task.date === date)
      .map((task) => task.order);
    return orders.length > 0 ? Math.max(...orders) + 1 : 0;
  }

  private createTask(
    draft: TaskDraft,
    generatedFromId?: string,
    seriesId?: string,
  ): AgendaPaneItem {
    const now = Date.now();
    return {
      id: this.createTaskId(),
      title: draft.title.trim(),
      date: draft.date,
      startTime: this.normalizeTime(draft.startTime),
      endTime: this.normalizeTime(draft.endTime),
      completed: false,
      priority: this.normalizePriority(draft.priority),
      notes: draft.notes.trim(),
      recurrence: this.normalizeRecurrence(draft.recurrence, draft.date),
      ...(generatedFromId ? { generatedFromId } : {}),
      ...(seriesId ? { seriesId } : {}),
      order: this.nextOrderForDate(draft.date),
      createdAt: now,
      updatedAt: now,
    };
  }

  private taskToDraft(task: AgendaPaneItem): TaskDraft {
    return {
      title: task.title,
      date: task.date,
      startTime: task.startTime,
      endTime: task.endTime,
      priority: task.priority,
      notes: task.notes,
      recurrence: structuredClone(task.recurrence),
    };
  }

  private assignSeriesIds(): void {
    const byId = new Map(this.data.tasks.map((task) => [task.id, task]));
    const findRootId = (task: AgendaPaneItem): string => {
      if (task.seriesId) return task.seriesId;
      let current = task;
      const visited = new Set<string>();
      while (current.generatedFromId && !visited.has(current.id)) {
        visited.add(current.id);
        const parent = byId.get(current.generatedFromId);
        if (!parent) break;
        current = parent;
      }
      return current.id;
    };

    for (const task of this.data.tasks) {
      if (task.recurrence.frequency !== "none" || task.generatedFromId) {
        task.seriesId = findRootId(task);
      }
    }
  }

  private expandAllRecurringSeries(): boolean {
    const before = this.data.tasks.length;
    const seriesIds = new Set(
      this.data.tasks.flatMap((task) =>
        task.seriesId && task.recurrence.frequency !== "none" ? [task.seriesId] : [],
      ),
    );
    for (const seriesId of seriesIds) this.expandRecurringSeries(seriesId);
    return this.data.tasks.length !== before;
  }

  private expandRecurringSeries(seriesId: string): void {
    const horizon = formatDateKey(addDays(new Date(), 366));
    const series = this.data.tasks
      .filter((task) => task.seriesId === seriesId && task.recurrence.frequency !== "none")
      .sort((left, right) => left.date.localeCompare(right.date));
    if (series.length === 0) return;

    const byDate = new Map(series.map((task) => [task.date, task]));
    const excluded = new Set(this.data.excludedOccurrences);
    let template = series[0];
    let cursorDate = template.date;
    let iterations = 0;

    while (cursorDate < horizon && iterations < 5000) {
      iterations += 1;
      const nextDate = getNextOccurrence(cursorDate, template.recurrence);
      if (!nextDate || nextDate <= cursorDate || nextDate > horizon) break;
      if (template.recurrence.untilDate && nextDate > template.recurrence.untilDate) break;
      cursorDate = nextDate;

      const existing = byDate.get(nextDate);
      if (existing) {
        template = existing;
        continue;
      }
      if (excluded.has(this.occurrenceKey(seriesId, nextDate))) continue;

      const next = this.createTask(
        { ...this.taskToDraft(template), date: nextDate },
        template.id,
        seriesId,
      );
      this.data.tasks.push(next);
      byDate.set(nextDate, next);
      template = next;
    }
  }

  private occurrenceKey(seriesId: string, date: string): string {
    return `${seriesId}@${date}`;
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
    const untilDate = frequency !== "none" && isDateKey(rule.untilDate)
      ? rule.untilDate
      : undefined;
    return {
      frequency,
      unit,
      interval: Math.max(1, Math.min(999, rawInterval || 1)),
      ...(anchorDate ? { anchorDate } : {}),
      ...(untilDate ? { untilDate } : {}),
    };
  }
}
