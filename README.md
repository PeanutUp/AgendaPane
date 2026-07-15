# DayTask

Calendar-first tasks for Obsidian, without daily notes.

DayTask gives you a self-contained calendar and task panel inside Obsidian. Select any date, add tasks, mark them complete, edit or move them, and delete them when they are no longer needed.

## What it does

- Month calendar with task counts
- Tasks for any selected date
- Add, complete, edit, reschedule, and delete tasks
- Repeat daily, on weekdays, weekly, monthly, yearly, or at a custom interval
- Automatically create the next occurrence when a repeating task is completed
- Optional time, priority, and notes for each task
- Monday- or Sunday-first calendar
- Responsive layout for desktop and mobile
- English and Chinese interface based on the Obsidian language
- Local, per-vault storage with no account or cloud dependency

## Where the data lives

DayTask does **not** create daily Markdown notes. Obsidian stores all plugin data in one file:

```text
<your-vault>/.obsidian/plugins/daytask/data.json
```

Obsidian's official `Plugin.loadData()` and `Plugin.saveData()` APIs manage this file. To keep tasks available on another device, make sure your sync method includes the vault's `.obsidian` directory.

## Repeating tasks

Use the sliders button beside the quick-add button, or edit an existing task, to configure its repeat rule. When you complete a repeating task, DayTask keeps that completed occurrence and creates the next one. Each occurrence is generated once, so unchecking and rechecking a task does not create duplicates.

## Install from source

1. Install dependencies with `npm install`.
2. Build with `npm run build`.
3. Create `<your-vault>/.obsidian/plugins/daytask/`.
4. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
5. Reload Obsidian, enable community plugins, and enable DayTask.

## Development

```bash
npm install
npm run dev
```

Run `npm run build` before a release. A GitHub release for the Obsidian community directory should attach `main.js`, `manifest.json`, and `styles.css`, with a tag matching the manifest version.

## Privacy

DayTask does not use the network, collect analytics, or read your notes. It only reads and writes its own plugin data through the Obsidian API.

## License

MIT
