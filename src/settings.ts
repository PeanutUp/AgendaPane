import { App, PluginSettingTab, Setting } from "obsidian";
import type AgendaPanePlugin from "../main";
import { getStrings } from "./i18n";

export class AgendaPaneSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: AgendaPanePlugin) {
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

  }
}
