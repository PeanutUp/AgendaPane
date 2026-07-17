# Changelog

All notable changes to AgendaPane are documented in this file. Versions follow [Semantic Versioning](https://semver.org/).

## [1.1.4] - 2026-07-17

### Release

- Temporarily publish without GitHub artifact attestations because Obsidian's verifier does not yet recognize the immutable OIDC subject format required for repositories created after July 15, 2026
- Keep unique JavaScript, manifest, and CSS digests so attestations can be restored cleanly after verifier support is available

## [1.1.3] - 2026-07-17 (not released)

### Release guard

- Detect that GitHub issued an immutable, repository-ID-based OIDC subject that the current Obsidian verifier cannot match
- Stop before signing or uploading assets, preventing another release with attestations that Obsidian would reject

## [1.1.2] - 2026-07-17

### Fixed

- Generate an independent build-provenance attestation for each required release asset
- Pin the attestation action to the immutable `v4.1.0` commit for verifier compatibility
- Add release-version markers to generated JavaScript and CSS so each release has unique asset digests

## [1.1.1] - 2026-07-17

### Fixed

- Preserve the AgendaPane leaf and its user-selected location when the plugin is disabled or reloaded
- Declare Obsidian 1.7.2 as the minimum supported version to match the sidebar APIs in use
- Remove unsafe task-data and recurrence-series type inference reported by the Community review
- Use void event callbacks where Obsidian and browser APIs require them
- Replace the deprecated `builtin-modules` development dependency

### Release

- Build, attest, and upload `main.js`, `manifest.json`, and `styles.css` automatically for version tags

## [1.1.0] - 2026-07-17

### Added

- Move an existing task to another date through the compact calendar
- Keyboard-accessible move mode with arrow-key navigation, confirmation, and cancellation
- Moving a recurring occurrence affects only that occurrence and preserves the remaining series
- Derive subtle priority backgrounds and priority-picker colors from the active Obsidian theme color

### Fixed

- Open AgendaPane in its own right-sidebar leaf instead of replacing an existing Calendar view
- Preserve Calendar and Daily Notes click behavior without adding note creation or opening logic to AgendaPane

## [1.0.0] - 2026-07-16

### Added

- Compact Calendar-inspired month view in the right sidebar
- Task creation, completion, editing, deletion, and saved drag ordering
- Optional start and end times with quick duration controls
- Four priority levels with subtle background-color indicators
- Notes displayed directly beneath task titles
- Daily, weekday, weekly, monthly, and custom recurrence
- Open-ended recurrence by default, with optional end controls for every recurrence type
- Integrated one-, three-, and six-month duration shortcuts
- Inline custom year, month, and day fields without a blocking system calendar popover
- Automatic time-first and priority-second sorting before manual reordering
- Arrow-key calendar navigation with automatic cross-month movement
- Monday-first and Sunday-first calendar settings
- English and Simplified Chinese interfaces
- Local per-vault task storage using Obsidian plugin data

### Privacy

- AgendaPane does not create or modify Markdown notes
- AgendaPane does not access the network, collect telemetry, or require an account

[1.1.4]: https://github.com/PeanutUp/AgendaPane/releases/tag/1.1.4
[1.1.3]: https://github.com/PeanutUp/AgendaPane/compare/1.1.2...1.1.3
[1.1.2]: https://github.com/PeanutUp/AgendaPane/releases/tag/1.1.2
[1.1.1]: https://github.com/PeanutUp/AgendaPane/releases/tag/1.1.1
[1.1.0]: https://github.com/PeanutUp/AgendaPane/releases/tag/1.1.0
[1.0.0]: https://github.com/PeanutUp/AgendaPane/releases/tag/1.0.0
