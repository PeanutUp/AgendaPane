# Changelog

All notable changes to AgendaPane are documented in this file. Versions follow [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-07-17

### Added

- Move an existing task to another date through the compact calendar
- Keyboard-accessible move mode with arrow-key navigation, confirmation, and cancellation
- Moving a recurring occurrence affects only that occurrence and preserves the remaining series

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

[1.1.0]: https://github.com/PeanutUp/AgendaPane/releases/tag/1.1.0
[1.0.0]: https://github.com/PeanutUp/AgendaPane/releases/tag/1.0.0
