import { App, Modal, Setting, setIcon } from "obsidian";
import { addMonthsClamped, formatDateKey, isDateKey, parseDateKey } from "./date-utils";
import { DayTaskStrings } from "./i18n";
import {
  RecurrenceFrequency,
  RecurrenceUnit,
  TaskDraft,
  TaskPriority,
} from "./types";

export class TaskModal extends Modal {
  private readonly draft: TaskDraft;
  private timeErrorEl: HTMLElement | null = null;
  private recurrenceErrorEl: HTMLElement | null = null;
  private customRecurrenceEndActive = false;
  private customRecurrenceEndValid = true;

  constructor(
    app: App,
    draft: TaskDraft,
    private readonly mode: "create" | "edit",
    private readonly strings: DayTaskStrings,
    private readonly onSave: (draft: TaskDraft) => Promise<void>,
  ) {
    super(app);
    this.draft = structuredClone(draft);
    if (this.draft.recurrence.frequency === "yearly") {
      this.draft.recurrence.frequency = "none";
    }
    if (this.draft.recurrence.frequency === "custom" && this.draft.recurrence.unit === "year") {
      this.draft.recurrence.unit = "month";
    }
  }

  onOpen(): void {
    this.setTitle(this.mode === "create" ? this.strings.createTask : this.strings.editTask);

    new Setting(this.contentEl)
      .setName(this.strings.taskTitle)
      .addText((text) => {
        text.setValue(this.draft.title).onChange((value) => {
          this.draft.title = value;
        });
        window.setTimeout(() => text.inputEl.focus(), 0);
        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key === "Enter") void this.submit();
        });
      });

    this.renderTimeRange();
    this.renderPriorityPicker();
    this.renderRecurrencePicker();

    new Setting(this.contentEl)
      .setName(this.strings.taskNotes)
      .addTextArea((text) => {
        text
          .setPlaceholder(this.strings.taskNotesPlaceholder)
          .setValue(this.draft.notes)
          .onChange((value) => {
            this.draft.notes = value;
          });
        text.inputEl.rows = 4;
      });

    const actions = this.contentEl.createDiv({ cls: "daytask-modal-actions" });
    const cancelButton = actions.createEl("button", { text: this.strings.cancel });
    cancelButton.addEventListener("click", () => this.close());

    const saveButton = actions.createEl("button", {
      cls: "mod-cta",
      text: this.strings.save,
    });
    saveButton.addEventListener("click", () => void this.submit());
  }

  private async submit(): Promise<void> {
    this.draft.title = this.draft.title.trim();
    this.draft.notes = this.draft.notes.trim();
    if (!this.draft.title || !/^\d{4}-\d{2}-\d{2}$/.test(this.draft.date)) return;
    if (!this.isTimeRangeValid()) {
      this.timeErrorEl?.removeClass("daytask-hidden");
      return;
    }
    if (this.customRecurrenceEndActive && !this.customRecurrenceEndValid) {
      this.recurrenceErrorEl?.removeClass("daytask-hidden");
      return;
    }
    if (
      this.draft.recurrence.frequency !== "none" &&
      this.draft.recurrence.untilDate &&
      this.draft.recurrence.untilDate < this.draft.date
    ) {
      this.recurrenceErrorEl?.removeClass("daytask-hidden");
      return;
    }
    await this.onSave(structuredClone(this.draft));
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private renderPriorityPicker(): void {
    const section = this.contentEl.createDiv({ cls: "daytask-choice-section" });
    section.createDiv({ cls: "daytask-choice-heading", text: this.strings.priority });
    const group = section.createDiv({ cls: "daytask-priority-picker" });
    const choices: Array<{ value: TaskPriority; label: string }> = [
      { value: "none", label: this.strings.priorityNone },
      { value: "low", label: this.strings.priorityLow },
      { value: "medium", label: this.strings.priorityMedium },
      { value: "high", label: this.strings.priorityHigh },
    ];

    for (const choice of choices) {
      const button = group.createEl("button", {
        cls: `daytask-priority-choice is-${choice.value}`,
        attr: {
          type: "button",
          title: choice.label,
          "aria-label": `${this.strings.priority}: ${choice.label}`,
          "aria-pressed": String(this.draft.priority === choice.value),
        },
      });
      button.dataset.value = choice.value;
      button.createSpan({ cls: "daytask-priority-choice-dot" });
      button.createSpan({ cls: "daytask-priority-choice-label", text: choice.label });
      button.toggleClass("is-selected", this.draft.priority === choice.value);
      button.addEventListener("click", () => {
        this.draft.priority = choice.value;
        this.updateChoiceSelection(group, choice.value);
      });
    }
  }

  private renderRecurrencePicker(): void {
    const section = this.contentEl.createDiv({ cls: "daytask-choice-section" });
    section.createDiv({ cls: "daytask-choice-heading", text: this.strings.recurrence });
    const group = section.createDiv({ cls: "daytask-recurrence-picker" });
    const customPanel = section.createDiv({ cls: "daytask-custom-recurrence" });
    const periodPanel = section.createDiv({ cls: "daytask-recurrence-period" });
    const choices: Array<{ value: RecurrenceFrequency; label: string }> = [
      { value: "none", label: this.strings.recurrenceNone },
      { value: "daily", label: this.strings.recurrenceDaily },
      { value: "weekdays", label: this.strings.recurrenceWeekdays },
      { value: "weekly", label: this.strings.recurrenceWeekly },
      { value: "monthly", label: this.strings.recurrenceMonthly },
      { value: "custom", label: this.strings.recurrenceCustom },
    ];

    const updatePanels = (): void => {
      customPanel.toggleClass("daytask-hidden", this.draft.recurrence.frequency !== "custom");
      periodPanel.toggleClass("daytask-hidden", this.draft.recurrence.frequency === "none");
    };

    for (const choice of choices) {
      const button = group.createEl("button", {
        cls: "daytask-recurrence-choice",
        text: choice.label,
        attr: {
          type: "button",
          "aria-pressed": String(this.draft.recurrence.frequency === choice.value),
        },
      });
      button.dataset.value = choice.value;
      button.toggleClass("is-selected", this.draft.recurrence.frequency === choice.value);
      button.addEventListener("click", () => {
        this.draft.recurrence.frequency = choice.value;
        if (choice.value === "custom" && this.draft.recurrence.unit === "year") {
          this.draft.recurrence.unit = "day";
        }
        this.updateChoiceSelection(group, choice.value);
        updatePanels();
        if (choice.value === "none") setPeriodMode("none");
        else refreshPeriodSelection();
      });
    }

    const intervalRow = customPanel.createDiv({ cls: "daytask-custom-row" });
    intervalRow.createSpan({ cls: "daytask-custom-label", text: this.strings.recurrenceEvery });
    const intervalInput = intervalRow.createEl("input", {
      cls: "daytask-recurrence-interval",
      attr: { type: "number", min: "1", max: "999", inputmode: "numeric" },
    });
    intervalInput.value = String(this.draft.recurrence.interval);
    intervalInput.addEventListener("input", () => {
      const value = Number.parseInt(intervalInput.value, 10);
      if (Number.isFinite(value)) this.draft.recurrence.interval = Math.max(1, Math.min(999, value));
    });

    const unitGroup = intervalRow.createDiv({ cls: "daytask-unit-picker" });
    const units: Array<{ value: Exclude<RecurrenceUnit, "year">; label: string }> = [
      { value: "day", label: this.strings.unitDay },
      { value: "week", label: this.strings.unitWeek },
      { value: "month", label: this.strings.unitMonth },
    ];
    for (const unit of units) {
      const button = unitGroup.createEl("button", {
        cls: "daytask-unit-choice",
        text: unit.label,
        attr: { type: "button", "aria-pressed": String(this.draft.recurrence.unit === unit.value) },
      });
      button.dataset.value = unit.value;
      button.toggleClass("is-selected", this.draft.recurrence.unit === unit.value);
      button.addEventListener("click", () => {
        this.draft.recurrence.unit = unit.value;
        this.updateChoiceSelection(unitGroup, unit.value);
      });
    }

    const periodHeader = periodPanel.createDiv({ cls: "daytask-recurrence-period-header" });
    const periodHeading = periodHeader.createDiv({ cls: "daytask-recurrence-period-heading" });
    const periodIcon = periodHeading.createSpan({ cls: "daytask-recurrence-period-icon" });
    setIcon(periodIcon, "calendar-range");
    periodHeading.createSpan({ text: this.strings.recurrencePeriod });
    periodHeader.createSpan({
      cls: "daytask-recurrence-start-summary",
      text: `${this.strings.recurrenceStarts} ${new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(parseDateKey(this.draft.date))}`,
      attr: { title: this.draft.date },
    });

    type PeriodMode = "none" | "one" | "three" | "six" | "custom";
    const startDate = parseDateKey(this.draft.date);
    const presetDates: Record<Exclude<PeriodMode, "none" | "custom">, string> = {
      one: formatDateKey(addMonthsClamped(startDate, 1)),
      three: formatDateKey(addMonthsClamped(startDate, 3)),
      six: formatDateKey(addMonthsClamped(startDate, 6)),
    };
    const existingUntil = this.draft.recurrence.untilDate;
    let periodMode: PeriodMode = !existingUntil
      ? "none"
      : existingUntil === presetDates.one
        ? "one"
        : existingUntil === presetDates.three
          ? "three"
          : existingUntil === presetDates.six
            ? "six"
            : "custom";

    const optionRow = periodPanel.createDiv({ cls: "daytask-recurrence-period-options" });
    const optionButtons = new Map<PeriodMode, HTMLButtonElement>();
    [
      { mode: "none" as const, label: this.strings.recurrenceNoEnd },
      { mode: "one" as const, label: this.strings.recurrenceOneMonth },
      { mode: "three" as const, label: this.strings.recurrenceThreeMonths },
      { mode: "six" as const, label: this.strings.recurrenceSixMonths },
      { mode: "custom" as const, label: this.strings.recurrenceCustomDate },
    ].forEach(({ mode, label }) => {
      const button = optionRow.createEl("button", {
        cls: "daytask-recurrence-period-option",
        text: label,
        attr: { type: "button" },
      });
      optionButtons.set(mode, button);
    });

    const customDate = periodPanel.createDiv({ cls: "daytask-recurrence-custom-date" });
    customDate.createSpan({
      cls: "daytask-recurrence-custom-date-label",
      text: this.strings.recurrenceUntil,
    });
    const initialCustomDate = existingUntil ?? presetDates.one;
    const initialParts = initialCustomDate.split("-");
    const createDatePart = (
      value: string,
      label: string,
      length: number,
    ): HTMLInputElement => {
      const field = customDate.createEl("label", { cls: "daytask-recurrence-date-part" });
      const input = field.createEl("input", {
        attr: {
          type: "text",
          inputmode: "numeric",
          maxlength: String(length),
          "aria-label": label,
        },
      });
      input.value = value;
      field.createSpan({ text: label });
      return input;
    };
    const yearInput = createDatePart(initialParts[0], this.strings.dateYear, 4);
    const monthInput = createDatePart(initialParts[1], this.strings.dateMonth, 2);
    const dayInput = createDatePart(initialParts[2], this.strings.dateDay, 2);

    const setCustomDateInputs = (date: string): void => {
      const [year, month, day] = date.split("-");
      yearInput.value = year;
      monthInput.value = month;
      dayInput.value = day;
    };

    const updateCustomDate = (): void => {
      const candidate = `${yearInput.value.padStart(4, "0")}-${monthInput.value.padStart(2, "0")}-${dayInput.value.padStart(2, "0")}`;
      const valid = isDateKey(candidate) && candidate >= this.draft.date;
      this.customRecurrenceEndActive = true;
      this.customRecurrenceEndValid = valid;
      if (valid) this.draft.recurrence.untilDate = candidate;
      else delete this.draft.recurrence.untilDate;
      customDate.toggleClass("is-invalid", !valid);
      this.recurrenceErrorEl?.addClass("daytask-hidden");
    };

    const refreshPeriodSelection = (): void => {
      optionButtons.forEach((button, mode) => {
        const selected = mode === periodMode;
        button.toggleClass("is-selected", selected);
        button.setAttr("aria-pressed", String(selected));
      });
      customDate.toggleClass("daytask-hidden", periodMode !== "custom");
    };

    const setPeriodMode = (mode: PeriodMode): void => {
      periodMode = mode;
      this.customRecurrenceEndActive = mode === "custom";
      this.customRecurrenceEndValid = true;
      if (mode === "none") delete this.draft.recurrence.untilDate;
      else if (mode === "custom") {
        setCustomDateInputs(this.draft.recurrence.untilDate ?? presetDates.one);
        updateCustomDate();
      }
      else this.draft.recurrence.untilDate = presetDates[mode];
      this.recurrenceErrorEl?.addClass("daytask-hidden");
      refreshPeriodSelection();
    };

    optionButtons.forEach((button, mode) => {
      button.addEventListener("click", () => setPeriodMode(mode));
    });
    [yearInput, monthInput, dayInput].forEach((input) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
        periodMode = "custom";
        updateCustomDate();
        refreshPeriodSelection();
      });
    });
    this.recurrenceErrorEl = periodPanel.createDiv({
      cls: "daytask-time-error daytask-hidden",
      text: this.strings.recurrenceUntilInvalid,
    });
    this.customRecurrenceEndActive = periodMode === "custom";
    this.customRecurrenceEndValid = true;
    updatePanels();
    refreshPeriodSelection();
  }

  private updateChoiceSelection(group: HTMLElement, value: string): void {
    group.querySelectorAll("button").forEach((element) => {
      const button = element as HTMLButtonElement;
      const selected = button.dataset.value === value;
      button.toggleClass("is-selected", selected);
      button.setAttr("aria-pressed", String(selected));
    });
  }

  private renderTimeRange(): void {
    const section = this.contentEl.createDiv({ cls: "daytask-time-section" });
    const header = section.createDiv({ cls: "daytask-time-header" });
    const heading = header.createDiv({ cls: "daytask-time-heading" });
    const icon = heading.createSpan({ cls: "daytask-time-range-icon" });
    setIcon(icon, "clock");
    heading.createSpan({ text: this.strings.taskTime });
    const clear = header.createEl("button", {
      cls: "daytask-time-clear",
      text: this.strings.clearTime,
      attr: { type: "button" },
    });

    const range = section.createDiv({ cls: "daytask-time-range" });
    const startInput = this.createTimeField(
      range,
      this.strings.startTime,
      this.draft.startTime,
      (value) => {
      this.draft.startTime = value;
      },
    );
    const separator = range.createSpan({ cls: "daytask-time-separator" });
    setIcon(separator, "arrow-right");
    const endInput = this.createTimeField(
      range,
      this.strings.endTime,
      this.draft.endTime,
      (value) => {
        this.draft.endTime = value;
      },
    );

    clear.addEventListener("click", () => {
      startInput.value = "";
      endInput.value = "";
      this.draft.startTime = "";
      this.draft.endTime = "";
      this.timeErrorEl?.addClass("daytask-hidden");
      startInput.focus();
    });

    const presets = section.createDiv({ cls: "daytask-time-presets" });
    [
      { label: this.strings.duration30, minutes: 30 },
      { label: this.strings.duration60, minutes: 60 },
      { label: this.strings.duration120, minutes: 120 },
    ].forEach(({ label, minutes }) => {
      const button = presets.createEl("button", {
        cls: "daytask-time-preset",
        text: label,
        attr: { type: "button" },
      });
      button.addEventListener("click", () => {
        const start = this.normalizeTimeText(startInput.value);
        if (!start) {
          startInput.focus();
          return;
        }
        const end = this.addMinutes(start, minutes);
        startInput.value = start;
        endInput.value = end;
        this.draft.startTime = start;
        this.draft.endTime = end;
        this.timeErrorEl?.addClass("daytask-hidden");
      });
    });

    this.timeErrorEl = section.createDiv({
      cls: "daytask-time-error daytask-hidden",
      text: this.strings.timeRangeInvalid,
    });
  }

  private createTimeField(
    parent: HTMLElement,
    label: string,
    value: string,
    onChange: (value: string) => void,
  ): HTMLInputElement {
    const field = parent.createEl("label", { cls: "daytask-time-field" });
    field.createSpan({ cls: "daytask-time-field-label", text: label });
    const input = field.createEl("input", {
      cls: "daytask-time-input",
      attr: {
        type: "text",
        inputmode: "numeric",
        maxlength: "5",
        autocomplete: "off",
        "aria-label": label,
      },
    });
    input.value = value;
    input.addEventListener("input", () => {
      onChange(input.value);
      this.timeErrorEl?.addClass("daytask-hidden");
    });
    input.addEventListener("blur", () => {
      const normalized = this.normalizeTimeText(input.value);
      if (normalized) {
        input.value = normalized;
        onChange(normalized);
      }
    });
    return input;
  }

  private isTimeRangeValid(): boolean {
    if (!this.draft.startTime && !this.draft.endTime) return true;
    if (!this.draft.startTime || !this.draft.endTime) return false;
    const start = this.normalizeTimeText(this.draft.startTime);
    const end = this.normalizeTimeText(this.draft.endTime);
    if (!start || !end) return false;
    this.draft.startTime = start;
    this.draft.endTime = end;
    return end > start;
  }

  private normalizeTimeText(value: string): string {
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, "");
    const shortMatch = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
    const candidate = /^\d{4}$/.test(digits)
      ? `${digits.slice(0, 2)}:${digits.slice(2)}`
      : shortMatch
        ? `${shortMatch[1].padStart(2, "0")}:${shortMatch[2]}`
        : trimmed;
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(candidate) ? candidate : "";
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(":").map(Number);
    const total = Math.min(hours * 60 + mins + minutes, 23 * 60 + 59);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
}
