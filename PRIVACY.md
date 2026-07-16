# Privacy

AgendaPane is a local-only Obsidian plugin.

## Data the plugin stores

AgendaPane stores task titles, dates, optional time ranges, completion state, priority, notes, recurrence rules, and saved task order in Obsidian's plugin data file:

```text
<your-vault>/.obsidian/plugins/daytask/data.json
```

The file is managed through Obsidian's official `Plugin.loadData()` and `Plugin.saveData()` APIs.

## Data the plugin does not access

AgendaPane does not:

- Read, create, edit, rename, or delete Markdown notes
- Scan the files in your vault
- Connect to external servers
- Require an account or authentication
- Collect telemetry, analytics, diagnostics, or advertising identifiers
- Include advertisements or paid features

## Sync and backups

AgendaPane does not provide its own sync service. If your existing sync tool includes the vault's `.obsidian` directory, it may sync `data.json` according to that tool's own privacy policy and settings.

Users are responsible for backing up `data.json`. Disabling the plugin keeps its data file. Uninstalling AgendaPane or deleting its plugin directory may remove the data permanently.

## Changes to this policy

Any future feature that accesses the network, external files, or third-party services will be disclosed here and in the README before release.

## Contact

For privacy questions, open an issue in the [AgendaPane repository](https://github.com/PeanutUp/AgendaPane/issues).
