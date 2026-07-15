import { App, Modal, Setting } from "obsidian";
import { DayTaskStrings } from "./i18n";
import {
  RecurrenceFrequency,
  RecurrenceUnit,
  TaskDraft,
  TaskPriority,
} from "./types";

export class TaskModal extends Modal {
  private readonly draft: TaskDraft;

  constructor(
    app: App,
    draft: TaskDraft,
    private readonly mode: "create" | "edit",
    private readonly strings: DayTaskStrings,
    private readonly onSave: (draft: TaskDraft) => Promise<void>,
  ) {
    super(app);
    this.draft = structuredClone(draft);
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

    new Setting(this.contentEl)
      .setName(this.strings.taskDate)
      .addText((text) => {
        text.inputEl.type = "date";
        text.setValue(this.draft.date).onChange((value) => {
          this.draft.date = value;
        });
      });

    new Setting(this.contentEl)
      .setName(this.strings.taskTime)
      .addText((text) => {
        text.inputEl.type = "time";
        text.setValue(this.draft.time).onChange((value) => {
          this.draft.time = value;
        });
      });

    new Setting(this.contentEl)
      .setName(this.strings.priority)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            none: this.strings.priorityNone,
            low: this.strings.priorityLow,
            medium: this.strings.priorityMedium,
            high: this.strings.priorityHigh,
          })
          .setValue(this.draft.priority)
          .onChange((value) => {
            this.draft.priority = value as TaskPriority;
          }),
      );

    let customSetting: Setting | null = null;
    const updateCustomVisibility = (): void => {
      customSetting?.settingEl.toggleClass(
        "daytask-hidden",
        this.draft.recurrence.frequency !== "custom",
      );
    };

    new Setting(this.contentEl)
      .setName(this.strings.recurrence)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            none: this.strings.recurrenceNone,
            daily: this.strings.recurrenceDaily,
            weekdays: this.strings.recurrenceWeekdays,
            weekly: this.strings.recurrenceWeekly,
            monthly: this.strings.recurrenceMonthly,
            yearly: this.strings.recurrenceYearly,
            custom: this.strings.recurrenceCustom,
          })
          .setValue(this.draft.recurrence.frequency)
          .onChange((value) => {
            this.draft.recurrence.frequency = value as RecurrenceFrequency;
            updateCustomVisibility();
          }),
      );

    customSetting = new Setting(this.contentEl)
      .setName(this.strings.recurrenceEvery)
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.inputEl.max = "999";
        text.setValue(String(this.draft.recurrence.interval)).onChange((value) => {
          const interval = Number.parseInt(value, 10);
          if (Number.isFinite(interval)) {
            this.draft.recurrence.interval = Math.max(1, Math.min(999, interval));
          }
        });
      })
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            day: this.strings.unitDay,
            week: this.strings.unitWeek,
            month: this.strings.unitMonth,
            year: this.strings.unitYear,
          })
          .setValue(this.draft.recurrence.unit)
          .onChange((value) => {
            this.draft.recurrence.unit = value as RecurrenceUnit;
          }),
      );
    updateCustomVisibility();

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
    await this.onSave(structuredClone(this.draft));
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ConfirmDeleteModal extends Modal {
  constructor(
    app: App,
    private readonly strings: DayTaskStrings,
    private readonly onConfirm: () => Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle(this.strings.confirmDeleteTitle);
    this.contentEl.createEl("p", { text: this.strings.confirmDeleteMessage });
    const actions = this.contentEl.createDiv({ cls: "daytask-modal-actions" });
    const cancelButton = actions.createEl("button", { text: this.strings.cancel });
    cancelButton.addEventListener("click", () => this.close());

    const deleteButton = actions.createEl("button", {
      cls: "mod-warning",
      text: this.strings.delete,
    });
    deleteButton.addEventListener("click", async () => {
      await this.onConfirm();
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
