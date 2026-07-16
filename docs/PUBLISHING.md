# DayTask publishing checklist

This checklist prepares DayTask for its first Obsidian Community directory submission.

## 1. Confirm the public identity

Current release identity:

- Name: `DayTask`
- Plugin ID: `daytask`
- Author: `PeanutUp`
- Repository: `https://github.com/PeanutUp/Obsidian-DayTask`
- Initial public version: `1.0.0`
- Minimum Obsidian version: `1.5.0`
- Description: `Plan one-off and recurring tasks in a sidebar calendar without creating Markdown notes.`

Before submission, search the Community directory one final time for both the name and ID. A plugin named **DayTasks** already exists. Although `DayTask` and `daytask` are different strings, the similarity can confuse users and weaken search visibility. If the product will be renamed, do it before the first public release and update the repository, manifest, data-folder migration plan, documentation, and screenshots together.

## 2. Final product checks

- Test enabling and disabling the plugin in a clean vault.
- Test creating, completing, reopening, editing, deleting, and manually reordering tasks.
- Test daily, weekday, weekly, monthly, and custom recurrence across month boundaries and through a selected end date.
- Confirm every newly selected recurrence type defaults to **No end**.
- Confirm one-, three-, and six-month shortcuts use the task date as the start and include valid occurrences on the end date.
- Confirm **Custom date** expands inline, validates year/month/day, and never opens a system calendar popover over the notes field.
- Confirm that removing recurrence keeps the current task and removes the other occurrences in its series.
- Test time validation and tasks without a time.
- Test arrow-key calendar navigation after clicking a date.
- Confirm no Markdown files are created or modified.
- Confirm existing `data.json` survives an update.
- Test both light and dark themes.
- Test a narrow sidebar.
- Test on mobile, or change `isDesktopOnly` before release if mobile support is not ready.

## 3. Capture media

Add a `docs/assets/` directory and capture images with Obsidian's default theme. Avoid showing private vault names or personal tasks.

Recommended media:

1. `daytask-sidebar.png` — calendar and several tasks in the sidebar
2. `daytask-editor.png` — time, labeled priority buttons, compact recurrence period, and notes
3. `daytask-recurrence.gif` — switch from the default **No end** state to a duration or custom date, then move through dates
4. `daytask-no-markdown.gif` — create a task while the file explorer remains unchanged
5. Optional dark-theme screenshot

Use the sidebar screenshot near the top of both README files. Keep GIFs short and optimized so the repository page loads quickly.

## 4. Build and commit

Run:

```bash
npm install
npm run build
git diff --check
```

Confirm that:

- `manifest.json`, `package.json`, and `package-lock.json` use version `1.0.0`.
- `versions.json` contains `"1.0.0": "1.5.0"`.
- `README.md`, `LICENSE`, and `manifest.json` are in the repository root.
- Source files and the package lock are committed.
- Production `main.js` is minified.
- `main.js` is not committed to the repository; it is attached to the release instead.

## 5. Create the GitHub release

In GitHub, open **Releases → Draft a new release**.

- Tag: `1.0.0` — do not use `v1.0.0`
- Target: the default branch containing the matching manifest
- Title: `DayTask 1.0.0`
- Description: copy the `1.0.0` section from `CHANGELOG.md`
- Attach `main.js`
- Attach `manifest.json`
- Attach `styles.css`

Publish the release and verify that all three assets can be downloaded separately.

## 6. Run a public beta

Before official submission, ask testers to install the repository through BRAT. Test with fresh data and with an upgraded copy of an existing `data.json`. Collect the Obsidian version, operating system, DayTask version, reproduction steps, and console errors for each bug.

## 7. Submit to Obsidian Community

1. Sign in at <https://community.obsidian.md>.
2. Link the GitHub account that owns the repository.
3. Open **Plugins → New plugin**.
4. Submit `https://github.com/PeanutUp/Obsidian-DayTask`.
5. Accept the developer policies and maintenance confirmation.
6. Address automated review feedback.

If review changes are required, increment the version, update `versions.json`, commit the fix, and publish a new matching GitHub release before re-running review.

Official references:

- <https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin>
- <https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins>
- <https://docs.obsidian.md/Developer+policies>

## 8. Future releases

After the initial submission is accepted, do not submit the plugin again for ordinary updates. Increment the version in the repository and publish a matching GitHub release with the same three assets. Obsidian reads the latest compatible release through `manifest.json` and `versions.json`.
