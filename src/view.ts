import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type DayTaskPlugin from "../main";
import {
  addMonths,
  formatDateKey,
  getCalendarDates,
  parseDateKey,
  sameMonth,
} from "./date-utils";
import { getStrings } from "./i18n";
import type { DayTaskItem, RecurrenceRule, TaskPriority } from "./types";

export const VIEW_TYPE_DAYTASK = "daytask-calendar-view";

export class DayTaskView extends ItemView {
  private selectedDate = formatDateKey(new Date());
  private visibleMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  private taskInput: HTMLInputElement | null = null;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: DayTaskPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_DAYTASK;
  }

  getDisplayText(): string {
    return getStrings().viewName;
  }

  getIcon(): string {
    return "calendar-check-2";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  async onClose(): Promise<void> {
    this.taskInput = null;
  }

  render(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("daytask-view");

    const shell = container.createDiv({ cls: "daytask-shell" });
    this.renderCalendar(shell);
    this.renderTasks(shell);
  }

  focusTaskInput(): void {
    this.taskInput?.focus();
  }

  selectToday(): void {
    const today = new Date();
    this.selectedDate = formatDateKey(today);
    this.visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.render();
  }

  private renderCalendar(parent: HTMLElement): void {
    const strings = getStrings();
    const section = parent.createEl("section", { cls: "daytask-calendar" });
    const header = section.createDiv({ cls: "daytask-calendar-header" });

    const previous = this.createIconButton(header, "chevron-left", strings.previousMonth);
    previous.addEventListener("click", () => {
      this.visibleMonth = addMonths(this.visibleMonth, -1);
      this.render();
    });

    const monthLabel = header.createEl("h3", { cls: "daytask-month-label" });
    monthLabel.setText(
      new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long" }).format(
        this.visibleMonth,
      ),
    );

    const next = this.createIconButton(header, "chevron-right", strings.nextMonth);
    next.addEventListener("click", () => {
      this.visibleMonth = addMonths(this.visibleMonth, 1);
      this.render();
    });

    const todayButton = section.createEl("button", {
      cls: "daytask-today-button",
      text: strings.today,
    });
    todayButton.addEventListener("click", () => this.selectToday());

    const grid = section.createDiv({ cls: "daytask-grid" });
    const mondayFirst = this.plugin.data.settings.weekStartsOnMonday;
    this.getWeekdayLabels(mondayFirst).forEach((label) => {
      grid.createDiv({ cls: "daytask-weekday", text: label });
    });

    const todayKey = formatDateKey(new Date());
    for (const date of getCalendarDates(this.visibleMonth, mondayFirst)) {
      const dateKey = formatDateKey(date);
      const tasks = this.plugin.getTasksForDate(dateKey);
      const completed = tasks.length > 0 && tasks.every((task) => task.completed);
      const dayButton = grid.createEl("button", {
        cls: "daytask-day",
        attr: {
          "aria-label": new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(date),
          "aria-pressed": String(dateKey === this.selectedDate),
        },
      });
      dayButton.createSpan({ cls: "daytask-day-number", text: String(date.getDate()) });
      dayButton.toggleClass("is-outside-month", !sameMonth(date, this.visibleMonth));
      dayButton.toggleClass("is-today", dateKey === todayKey);
      dayButton.toggleClass("is-selected", dateKey === this.selectedDate);
      dayButton.toggleClass("has-tasks", tasks.length > 0);
      dayButton.toggleClass("is-complete", completed);

      if (tasks.length > 0) {
        dayButton.createSpan({
          cls: "daytask-day-count",
          text: tasks.length > 9 ? "9+" : String(tasks.length),
        });
      }

      dayButton.addEventListener("click", () => {
        this.selectedDate = dateKey;
        if (!sameMonth(date, this.visibleMonth)) {
          this.visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        }
        this.render();
      });
    }
  }

  private renderTasks(parent: HTMLElement): void {
    const strings = getStrings();
    const selected = parseDateKey(this.selectedDate);
    const tasks = this.plugin.getTasksForDate(this.selectedDate);
    const section = parent.createEl("section", { cls: "daytask-tasks" });
    const header = section.createDiv({ cls: "daytask-tasks-header" });
    const headingGroup = header.createDiv();
    headingGroup.createEl("h3", {
      text: new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(selected),
    });
    headingGroup.createDiv({
      cls: "daytask-task-count",
      text: `${tasks.length} ${strings.tasks}`,
    });

    const form = section.createEl("form", { cls: "daytask-add-form" });
    this.taskInput = form.createEl("input", {
      cls: "daytask-add-input",
      attr: {
        type: "text",
        placeholder: strings.addPlaceholder,
        "aria-label": strings.addPlaceholder,
        maxlength: "500",
        autocomplete: "off",
      },
    });
    const addButton = form.createEl("button", {
      cls: "daytask-add-button mod-cta",
      attr: { type: "submit", "aria-label": strings.addTask },
    });
    setIcon(addButton, "plus");
    const advancedButton = form.createEl("button", {
      cls: "daytask-advanced-button",
      attr: { type: "button", "aria-label": strings.advancedAdd, title: strings.advancedAdd },
    });
    setIcon(advancedButton, "settings-2");
    advancedButton.addEventListener("click", () => this.plugin.openCreateModal(this.selectedDate));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = this.taskInput?.value.trim() ?? "";
      if (!title) {
        this.taskInput?.focus();
        return;
      }
      await this.plugin.addTask(title, this.selectedDate);
      this.focusTaskInput();
    });

    if (tasks.length === 0) {
      const empty = section.createDiv({ cls: "daytask-empty" });
      const icon = empty.createDiv({ cls: "daytask-empty-icon" });
      setIcon(icon, "calendar-days");
      empty.createDiv({ cls: "daytask-empty-title", text: strings.noTasks });
      empty.createDiv({ cls: "daytask-empty-hint", text: strings.noTasksHint });
      return;
    }

    const list = section.createDiv({ cls: "daytask-task-list" });
    for (const task of tasks) {
      const row = list.createDiv({ cls: "daytask-task-row" });
      row.toggleClass("is-completed", task.completed);

      const checkbox = row.createEl("input", {
        cls: "daytask-checkbox",
        attr: {
          type: "checkbox",
          "aria-label": task.completed ? strings.incomplete : strings.complete,
        },
      });
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        void this.plugin.setTaskCompleted(task.id, checkbox.checked);
      });

      const content = row.createDiv({ cls: "daytask-task-content" });
      const title = content.createDiv({ cls: "daytask-task-title", text: task.title });
      title.setAttr("title", task.title);
      this.renderTaskMeta(content, task);

      const actions = row.createDiv({ cls: "daytask-task-actions" });
      const editButton = this.createIconButton(actions, "pencil", strings.editTask);
      editButton.addEventListener("click", () => this.plugin.openEditModal(task));

      const deleteButton = this.createIconButton(actions, "trash-2", strings.deleteTask);
      deleteButton.addClass("daytask-delete-button");
      deleteButton.addEventListener("click", () => this.plugin.requestDeleteTask(task));
    }
  }

  private createIconButton(parent: HTMLElement, icon: string, label: string): HTMLButtonElement {
    const button = parent.createEl("button", {
      cls: "daytask-icon-button clickable-icon",
      attr: { type: "button", "aria-label": label, title: label },
    });
    setIcon(button, icon);
    return button;
  }

  private renderTaskMeta(parent: HTMLElement, task: DayTaskItem): void {
    if (
      !task.time &&
      task.priority === "none" &&
      !task.notes &&
      task.recurrence.frequency === "none"
    ) {
      return;
    }

    const strings = getStrings();
    const meta = parent.createDiv({ cls: "daytask-task-meta" });
    if (task.priority !== "none") {
      const priorityLabels: Record<Exclude<TaskPriority, "none">, string> = {
        low: strings.priorityLow,
        medium: strings.priorityMedium,
        high: strings.priorityHigh,
      };
      const priority = meta.createSpan({
        cls: `daytask-priority is-${task.priority}`,
        attr: { title: `${strings.priority}: ${priorityLabels[task.priority]}` },
      });
      priority.createSpan({ cls: "daytask-priority-dot" });
      priority.createSpan({ text: priorityLabels[task.priority] });
    }
    if (task.time) {
      const time = meta.createSpan({ cls: "daytask-meta-item", text: task.time });
      const icon = time.createSpan({ cls: "daytask-meta-icon" });
      setIcon(icon, "clock");
      time.prepend(icon);
    }
    if (task.recurrence.frequency !== "none") {
      const repeat = meta.createSpan({
        cls: "daytask-meta-item",
        text: this.getRecurrenceLabel(task.recurrence),
      });
      const icon = repeat.createSpan({ cls: "daytask-meta-icon" });
      setIcon(icon, "repeat");
      repeat.prepend(icon);
    }
    if (task.notes) {
      const notes = meta.createSpan({
        cls: "daytask-meta-item daytask-notes-indicator",
        attr: { title: task.notes, "aria-label": strings.taskNotes },
      });
      setIcon(notes, "file-text");
    }
  }

  private getRecurrenceLabel(rule: RecurrenceRule): string {
    const strings = getStrings();
    const labels = {
      daily: strings.recurrenceDaily,
      weekdays: strings.recurrenceWeekdays,
      weekly: strings.recurrenceWeekly,
      monthly: strings.recurrenceMonthly,
      yearly: strings.recurrenceYearly,
    };
    if (rule.frequency !== "custom" && rule.frequency !== "none") return labels[rule.frequency];
    if (rule.frequency === "custom") {
      const units = {
        day: strings.unitDay,
        week: strings.unitWeek,
        month: strings.unitMonth,
        year: strings.unitYear,
      };
      return `${strings.recurrenceEvery} ${rule.interval} ${units[rule.unit]}`;
    }
    return "";
  }

  private getWeekdayLabels(mondayFirst: boolean): string[] {
    const labels = Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(
        new Date(2026, 0, 4 + index),
      ),
    );
    return mondayFirst ? [...labels.slice(1), labels[0]] : labels;
  }
}
