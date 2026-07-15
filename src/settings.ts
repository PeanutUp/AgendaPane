import { App, PluginSettingTab, Setting } from "obsidian";
import type DayTaskPlugin from "../main";
import { getStrings } from "./i18n";

export class DayTaskSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: DayTaskPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const strings = getStrings();
    containerEl.empty();

    new Setting(containerEl)
      .setName(strings.settingsWeekStart)
      .setDesc(strings.settingsWeekStartDesc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.data.settings.weekStartsOnMonday)
          .onChange(async (value) => {
            this.plugin.data.settings.weekStartsOnMonday = value;
            await this.plugin.persistData();
            this.plugin.refreshViews();
          }),
      );

    new Setting(containerEl)
      .setName(strings.settingsConfirmDelete)
      .setDesc(strings.settingsConfirmDeleteDesc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.data.settings.confirmBeforeDelete)
          .onChange(async (value) => {
            this.plugin.data.settings.confirmBeforeDelete = value;
            await this.plugin.persistData();
          }),
      );
  }
}
