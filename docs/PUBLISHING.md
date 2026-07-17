# AgendaPane publishing checklist

This checklist prepares AgendaPane releases for Obsidian Community review.

## 1. Confirm the public identity

Current release identity:

- Name: `AgendaPane`
- Plugin ID: `daytask`
- Author: `PeanutUp`
- Repository: `https://github.com/PeanutUp/AgendaPane`
- Current release version: `1.1.3`
- Minimum Obsidian version: `1.7.2`
- Description: `Plan one-off and recurring tasks in a sidebar calendar without creating Markdown notes.`

Before submission, search the Community directory one final time for both `AgendaPane` and the persistent plugin ID `daytask`. The display name was changed before the first Community-directory submission, while the ID remains unchanged to preserve existing installations, data, saved workspaces, and shortcuts.

### Rename the GitHub repository

Before creating the public release:

1. Open the current repository on GitHub and go to **Settings → General → Repository name**.
2. Rename it to `AgendaPane`.
3. Update the local remote:

   ```bash
   git remote set-url origin https://github.com/PeanutUp/AgendaPane.git
   git remote -v
   ```

4. Confirm that the README, release links, Issues links, security links, and submission URL all use `https://github.com/PeanutUp/AgendaPane`.

The local project folder may also be renamed, but its name does not affect Obsidian or GitHub. Do not rename the installed plugin folder from `daytask`; it must continue to match the persistent plugin ID.

## 2. Final product checks

- Test enabling and disabling the plugin in a clean vault.
- Test creating, completing, reopening, editing, deleting, and manually reordering tasks.
- Test moving one-off and recurring tasks within a month and across month boundaries.
- Test daily, weekday, weekly, monthly, and custom recurrence across month boundaries and through a selected end date.
- Confirm every newly selected recurrence type defaults to **No end**.
- Confirm one-, three-, and six-month shortcuts use the task date as the start and include valid occurrences on the end date.
- Confirm **Custom date** expands inline, validates year/month/day, and never opens a system calendar popover over the notes field.
- Confirm that removing recurrence keeps the current task and removes the other occurrences in its series.
- Test time validation and tasks without a time.
- Test arrow-key calendar navigation after clicking a date.
- With Calendar and Daily Notes enabled, confirm AgendaPane opens in a separate sidebar leaf and Calendar dates still open or create daily notes.
- Confirm AgendaPane itself never opens or creates a daily note.
- Confirm no Markdown files are created or modified.
- Confirm existing `data.json` survives an update.
- Test both light and dark themes.
- Test a narrow sidebar.
- Test on mobile, or change `isDesktopOnly` before release if mobile support is not ready.

## 3. Capture media

Add a `docs/assets/` directory and capture images with Obsidian's default theme. Avoid showing private vault names or personal tasks.

Recommended media:

1. `agenda-pane-sidebar.png` — calendar and several tasks in the sidebar
2. `agenda-pane-editor.png` — time, labeled priority buttons, compact recurrence period, and notes
3. `agenda-pane-recurrence.gif` — switch from the default **No end** state to a duration or custom date, then move through dates
4. `agenda-pane-no-markdown.gif` — create a task while the file explorer remains unchanged
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

- `manifest.json`, `package.json`, and `package-lock.json` use version `1.1.3`.
- `versions.json` contains `"1.1.3": "1.7.2"`.
- `README.md`, `LICENSE`, and `manifest.json` are in the repository root.
- Source files and the package lock are committed.
- Production `main.js` is minified.
- `main.js` is not committed to the repository; the release workflow builds and attaches it instead.

## 5. Create the attested GitHub release

Commit and push the release source first. Then create and push the exact version tag; do not add a `v` prefix:

```bash
git push origin main
git tag 1.1.3
git push origin 1.1.3
```

The **Release** workflow checks that the tag matches `manifest.json`, `package.json`, and `versions.json`; installs locked dependencies; builds the plugin; restores and verifies the name-based GitHub OIDC subject currently required by Obsidian; creates one GitHub build-provenance attestation covering all release assets; and creates the release with `main.js`, `manifest.json`, and `styles.css`. Do not upload local copies manually.

Open **Actions → Release** and wait for the run to pass. Then open **Releases → AgendaPane 1.1.3** and verify that all three assets can be downloaded separately and that the release shows artifact attestations.

## 6. Run a public beta

Before official submission, ask testers to install the repository through BRAT. Test with fresh data and with an upgraded copy of an existing `data.json`. Collect the Obsidian version, operating system, AgendaPane version, reproduction steps, and console errors for each bug.

## 7. Submit to Obsidian Community

1. Sign in at <https://community.obsidian.md>.
2. Link the GitHub account that owns the repository.
3. Open **Plugins → New plugin**.
4. Submit `https://github.com/PeanutUp/AgendaPane`.
5. Accept the developer policies and maintenance confirmation.
6. Address automated review feedback.

For this attestation compatibility correction, publish `1.1.3`, wait for the Release workflow to pass, and then re-run the automated review. If further review changes are required, increment the patch version, update `versions.json`, commit the fix, and push a new matching tag.

Official references:

- <https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin>
- <https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins>
- <https://docs.obsidian.md/Developer+policies>

## 8. Future releases

After the initial submission is accepted, do not submit the plugin again for ordinary updates. Increment the version in the repository, update `versions.json`, and push a matching tag. The workflow publishes the three attested assets, and Obsidian reads the latest compatible release through `manifest.json` and `versions.json`.
