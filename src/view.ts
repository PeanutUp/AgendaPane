import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type DayTaskPlugin from "../main";
import {
  addDays,
  addMonths,
  formatDateKey,
  getCalendarDates,
  parseDateKey,
  sameMonth,
} from "./date-utils";
import { getStrings } from "./i18n";
import type { DayTaskItem, TaskPriority } from "./types";

export const VIEW_TYPE_DAYTASK = "daytask-calendar-view";

export class DayTaskView extends ItemView {
  private selectedDate = formatDateKey(new Date());
  private visibleMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  private taskInput: HTMLInputElement | null = null;
  private draggedTaskId: string | null = null;

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
    const title = header.createDiv({ cls: "daytask-calendar-title" });
    title.createSpan({
      cls: "daytask-calendar-month",
      text: new Intl.DateTimeFormat(undefined, { month: "long" }).format(this.visibleMonth),
    });
    title.createSpan({
      cls: "daytask-calendar-year",
      text: String(this.visibleMonth.getFullYear()),
    });

    const controls = header.createDiv({ cls: "daytask-calendar-controls" });
    const previous = this.createIconButton(controls, "chevron-left", strings.previousMonth);
    previous.addEventListener("click", () => {
      this.visibleMonth = addMonths(this.visibleMonth, -1);
      this.render();
    });
    const today = controls.createEl("button", {
      cls: "daytask-header-today",
      text: strings.today,
      attr: { type: "button" },
    });
    today.addEventListener("click", () => this.selectToday());
    const next = this.createIconButton(controls, "chevron-right", strings.nextMonth);
    next.addEventListener("click", () => {
      this.visibleMonth = addMonths(this.visibleMonth, 1);
      this.render();
    });

    const grid = section.createDiv({ cls: "daytask-grid" });
    grid.setAttr("role", "grid");
    const mondayFirst = this.plugin.data.settings.weekStartsOnMonday;
    this.getWeekdayLabels(mondayFirst).forEach((label) => {
      grid.createDiv({ cls: "daytask-weekday", text: label });
    });

    const todayKey = formatDateKey(new Date());
    const calendarDates = getCalendarDates(this.visibleMonth, mondayFirst);
    const selectedIsVisible = calendarDates.some(
      (date) => formatDateKey(date) === this.selectedDate,
    );
    const keyboardFocusDate = selectedIsVisible
      ? this.selectedDate
      : formatDateKey(new Date(this.visibleMonth.getFullYear(), this.visibleMonth.getMonth(), 1));
    for (const date of calendarDates) {
      const dateKey = formatDateKey(date);
      const dayButton = grid.createEl("button", {
        cls: "daytask-day",
        attr: {
          "data-date": dateKey,
          "aria-label": new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(date),
          "aria-pressed": String(dateKey === this.selectedDate),
          tabindex: dateKey === keyboardFocusDate ? "0" : "-1",
        },
      });
      dayButton.createSpan({ cls: "daytask-day-number", text: String(date.getDate()) });
      dayButton.toggleClass("is-outside-month", !sameMonth(date, this.visibleMonth));
      dayButton.toggleClass("is-today", dateKey === todayKey);
      dayButton.toggleClass("is-selected", dateKey === this.selectedDate);

      dayButton.addEventListener("click", () => {
        this.selectDate(date, true);
      });
      dayButton.addEventListener("keydown", (event) => {
        const offsets: Partial<Record<string, number>> = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -7,
          ArrowDown: 7,
        };
        const offset = offsets[event.key];
        if (offset === undefined) return;
        event.preventDefault();
        this.selectDate(addDays(date, offset), true);
      });
    }
  }

  private selectDate(date: Date, restoreFocus: boolean): void {
    this.selectedDate = formatDateKey(date);
    if (!sameMonth(date, this.visibleMonth)) {
      this.visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    this.render();
    if (restoreFocus) {
      window.setTimeout(() => {
        const button = this.containerEl.querySelector<HTMLButtonElement>(
          `.daytask-day[data-date="${this.selectedDate}"]`,
        );
        button?.focus();
      }, 0);
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
      const row = list.createDiv({
        cls: `daytask-task-row is-priority-${task.priority}`,
      });
      row.dataset.taskId = task.id;
      row.draggable = true;
      row.setAttr("title", strings.reorderTask);
      row.toggleClass("is-completed", task.completed);
      row.addEventListener("dragstart", (event) => {
        this.draggedTaskId = task.id;
        event.dataTransfer?.setData("text/plain", task.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        row.addClass("is-dragging");
      });
      row.addEventListener("dragend", () => {
        this.draggedTaskId = null;
        this.clearDragStyles();
      });
      row.addEventListener("dragover", (event) => {
        if (!this.draggedTaskId || this.draggedTaskId === task.id) return;
        event.preventDefault();
        const placeAfter = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
        row.toggleClass("drop-before", !placeAfter);
        row.toggleClass("drop-after", placeAfter);
      });
      row.addEventListener("dragleave", () => {
        row.removeClass("drop-before");
        row.removeClass("drop-after");
      });
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        const sourceId = this.draggedTaskId ?? event.dataTransfer?.getData("text/plain");
        if (!sourceId || sourceId === task.id) return;
        const placeAfter = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
        this.draggedTaskId = null;
        this.clearDragStyles();
        void this.plugin.reorderTask(sourceId, task.id, placeAfter);
      });

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
      if (task.notes) {
        content.createDiv({ cls: "daytask-task-notes", text: task.notes });
      }

      const actions = row.createDiv({ cls: "daytask-task-actions" });
      const editButton = this.createIconButton(actions, "pencil", strings.editTask);
      editButton.addEventListener("click", () => this.plugin.openEditModal(task));

      const deleteButton = this.createIconButton(actions, "trash-2", strings.deleteTask);
      deleteButton.addClass("daytask-delete-button");
      deleteButton.addEventListener("click", () => void this.plugin.deleteTask(task.id));
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

  private clearDragStyles(): void {
    this.containerEl
      .querySelectorAll(".daytask-task-row")
      .forEach((element) => element.removeClass("is-dragging", "drop-before", "drop-after"));
  }

  private renderTaskMeta(parent: HTMLElement, task: DayTaskItem): void {
    if (
      !task.startTime &&
      !task.endTime &&
      task.priority === "none"
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
    if (task.startTime || task.endTime) {
      const label =
        task.startTime && task.endTime
          ? `${task.startTime}–${task.endTime}`
          : task.startTime || task.endTime;
      const time = meta.createSpan({ cls: "daytask-meta-item", text: label });
      const icon = time.createSpan({ cls: "daytask-meta-icon" });
      setIcon(icon, "clock");
      time.prepend(icon);
    }
  }

  private getWeekdayLabels(mondayFirst: boolean): string[] {
    const labels = Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
        new Date(2026, 0, 4 + index),
      ),
    );
    return mondayFirst ? [...labels.slice(1), labels[0]] : labels;
  }
}
