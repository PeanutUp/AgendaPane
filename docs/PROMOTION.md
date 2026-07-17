# AgendaPane launch copy and promotion plan

## Positioning

Lead with one clear difference:

> A calendar task manager inside Obsidian that does not create or modify Markdown notes.

Supporting points:

- Compact calendar and tasks together in the sidebar
- Local-only storage with no account or telemetry
- Time ranges, priorities, notes, open-ended or time-limited recurrence, date moving, and manual ordering
- English and Chinese interface

Avoid describing AgendaPane as a replacement for every advanced task-management plugin. It is intentionally focused on quick, date-based planning without adding files to the vault.

## One-line descriptions

### English

> AgendaPane is a compact sidebar calendar for planning recurring and one-off tasks in Obsidian without creating or modifying Markdown notes. Recurrence is open-ended by default and can be limited when needed.

### 简体中文

> AgendaPane 是一个紧凑的 Obsidian 侧边栏日历任务插件，支持时间、优先级、备注和循环任务；循环默认不设截止，需要时可以限期，而且不会创建或修改任何 Markdown 笔记。

## Obsidian forum / GitHub launch post — English

### Title

AgendaPane — calendar-first sidebar tasks without creating daily notes

### Body

I built AgendaPane for a simple workflow: click a date, see its tasks immediately, and plan the day without generating daily notes or inserting task syntax into existing Markdown files.

AgendaPane stays in the Obsidian sidebar and stores its data locally in the plugin's `data.json`. It supports optional time ranges, subtle theme-aware priority colors, notes, daily/weekday/weekly/monthly/custom recurrence, moving tasks to another date, automatic sorting, and manual drag ordering. Recurrence is open-ended by default; one-, three-, and six-month durations and an inline custom end date are available when needed. The calendar can also be navigated with the arrow keys. AgendaPane uses its own sidebar leaf, so Calendar and Daily Notes keep their normal click behavior.

The plugin does not read note contents, use the network, collect telemetry, or require an account.

Repository: https://github.com/PeanutUp/AgendaPane

I would especially appreciate feedback on mobile behavior, recurring tasks, keyboard navigation, and narrow sidebar layouts.

## 中文长文案

### 标题

我做了一个不会生成每日笔记的 Obsidian 日历任务插件

### 正文

我想要的是一种很直接的使用方式：点击日历日期，下面马上显示当天任务；可以添加、完成、编辑、拖动排序或删除，但不会为了任务在仓库里生成很多 Markdown 文件。

AgendaPane 默认显示在 Obsidian 右侧边栏，任务数据只保存在插件自己的 `data.json` 中。它支持开始与结束时间、跟随 Obsidian 主题色的浅色优先级、备注、每天/工作日/每周/每月/自定义循环，也可以把已有任务移动到其他日期，同时支持自动排序、手动拖动排序和方向键操作日历。循环默认不设截止，需要时可直接选择 1/3/6 个月，或在原位置填写自定义年月日。AgendaPane 使用独立侧边栏页签，因此 Calendar 和 Daily Notes 会继续保持原来的日期点击行为。

插件不会读取笔记正文，不连接网络，不收集使用数据，也不需要注册账号。

GitHub：https://github.com/PeanutUp/AgendaPane

如果你愿意试用，希望能帮我重点看看移动端、循环任务、键盘操作和窄侧边栏下的显示效果。

## Short social posts

### English

> I made AgendaPane, a compact calendar and task list for the Obsidian sidebar. Plan one-off or recurring tasks with optional durations, priorities, and notes—without creating or modifying Markdown files. Local-only, no account, no telemetry. https://github.com/PeanutUp/AgendaPane

### 简体中文

> 做了一个 Obsidian 侧边栏日历任务插件 AgendaPane：点击日期就能安排任务，支持时间、浅色优先级、备注和可限期循环，而且不会创建或修改 Markdown 笔记。数据仅保存在本地，无账号、无遥测。https://github.com/PeanutUp/AgendaPane

## Suggested publishing order

1. Publish the GitHub release and improve the repository landing page.
2. Invite a small BRAT beta group and fix reproducible issues.
3. Submit to the Obsidian Community directory.
4. After approval, post in Obsidian **Share & showcase** and Discord `#updates`.
5. Reuse the short demo on Reddit, Bilibili, Xiaohongshu, Zhihu, and Chinese Obsidian communities.
6. Reply to early reports quickly and turn repeated questions into README or troubleshooting updates.

## Demo storyboard

A 15–25 second video is enough:

1. Show the file explorer and compact AgendaPane sidebar.
2. Click a date and create `Review project` with a start and end time.
3. Select high priority and a weekday recurrence; show the default **No end** state, then choose three months or a custom date.
4. Save, move through two dates with arrow keys, and show the recurring task.
5. Complete and reorder tasks.
6. End on the unchanged file explorer with the caption: `No Markdown notes created.`

Do not use real names, private vault titles, or sensitive tasks in promotional media.
