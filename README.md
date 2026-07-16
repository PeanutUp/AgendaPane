# AgendaPane

[简体中文](README.zh-CN.md)

**Calendar-first task planning in the Obsidian sidebar, without creating or modifying Markdown notes.**

AgendaPane gives each day a focused task list beneath a compact monthly calendar. It is designed for people who want lightweight scheduling inside Obsidian but do not want task records mixed into daily notes or scattered across the vault.

## Highlights

- Compact calendar and task list in the right sidebar
- No generated daily notes and no changes to existing Markdown files
- Quick task capture for the selected calendar day
- Optional start and end times with quick duration controls
- Four priority levels shown with subtle task background colors
- Notes displayed directly beneath each task
- Recurrence: daily, weekdays, weekly, monthly, or a custom interval
- Every recurrence is open-ended by default, with optional duration or end-date controls
- Complete, reopen, edit, reorder, and delete tasks directly
- Automatic ordering by time and then priority until a day is manually reordered
- Arrow-key calendar navigation with automatic month changes
- Monday-first or Sunday-first calendar
- English and Simplified Chinese interface
- Local, per-vault storage with no account, telemetry, or cloud service

## How it works

1. Enable AgendaPane. It opens automatically in the right sidebar.
2. Select a date in the calendar.
3. Type into the quick-add field, or use the details button for time, priority, recurrence, and notes.
4. Check a task to complete it, drag the task card to reorder it, or use its edit and delete actions.

The task date always comes from the selected calendar day, so there is no second date picker in the task editor.

## Keyboard navigation

After clicking a calendar date, use:

- `Left` / `Right` to move one day
- `Up` / `Down` to move one week
- `Enter` or `Space` to activate a focused date

Moving beyond the current month automatically changes the visible month.

## Recurring tasks

AgendaPane supports daily, weekday, weekly, monthly, and custom recurrence. Every recurring task can have an optional end date. Custom recurrence can repeat every chosen number of days, weeks, or months.

The compact repeat-period row uses the selected calendar date as the fixed start. It defaults to **No end** and also offers one-, three-, and six-month durations. Choose **Custom date** only when you need an exact year, month, and day. The custom fields expand inline, so no system calendar popover covers the rest of the editor. A matching occurrence on the end date is included.

Occurrences are generated ahead for the coming year and the horizon is extended whenever the plugin loads. Removing recurrence from an occurrence keeps that task and removes the other occurrences in the series.

## Sorting and manual order

Before a day is manually reordered, AgendaPane sorts tasks as follows:

1. Tasks with a time range, ordered by start time
2. Priority from high to low
3. Tasks without a time range

Dragging any part of a task card switches that day to a saved manual order.

## Data storage

AgendaPane does not create Markdown notes. Obsidian stores its data in:

```text
<your-vault>/.obsidian/plugins/daytask/data.json
```

The plugin uses Obsidian's `Plugin.loadData()` and `Plugin.saveData()` APIs. It does not read note contents, connect to the internet, collect analytics, or require an account. See [Privacy](PRIVACY.md) for details.

The folder remains named `daytask` because that is the plugin's persistent ID. Keeping the ID stable preserves existing task data, saved workspaces, and shortcuts while the display name changes to AgendaPane.

If you use Obsidian on multiple devices, configure your sync solution to include the vault's `.obsidian` directory. Back up `data.json` if the task database is important to you.

## Installation

### Community plugins

After AgendaPane is accepted into the Obsidian Community directory:

1. Open **Settings → Community plugins → Browse**.
2. Search for **AgendaPane**.
3. Select **Install**, then **Enable**.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the matching [GitHub release](https://github.com/PeanutUp/AgendaPane/releases).
2. Create `<your-vault>/.obsidian/plugins/daytask/`.
3. Place the three files directly inside that folder.
4. Reload Obsidian and enable AgendaPane under **Community plugins**.

### Build from source

```bash
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` into `<your-vault>/.obsidian/plugins/daytask/`, then reload Obsidian.

## Compatibility

- Obsidian 1.5.0 or newer
- Desktop and mobile are declared supported
- Drag-and-drop task reordering depends on the platform's drag support

## Development

```bash
npm install
npm run dev
```

Use `npm run build` for a production build. Release tags must exactly match the version in `manifest.json` and must not include a `v` prefix. Attach `main.js`, `manifest.json`, and `styles.css` to every GitHub release.

## Support

- Report bugs or request features in [GitHub Issues](https://github.com/PeanutUp/AgendaPane/issues).
- For security-sensitive reports, follow [SECURITY.md](SECURITY.md).
- See [CHANGELOG.md](CHANGELOG.md) for release notes.

## License

[MIT](LICENSE) © 2026 PeanutUp
