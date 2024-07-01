# Change Log

All notable changes to the "arcade-vsc" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.2] - 2024-07-01

### Fixed

- Updated the README to reflect the new changes.

### Changed

- Reduced polling interval. The clock wil still work as normal. Start/Pause/Resume/End may be delayed.
- Improved error handling for when the API is down to reduce the amount of requests.
- Added back Slack user IDs as now required by the API. You will need to re-init.

## [0.6.1] - 2024-06-30

### Changed

- Now uses API key for authentication to match the recent API changes.

## [0.6.0] - 2024-06-24

### Added

- You can now click the status bar item to directly open Slack.
- The goal is now shown in relevant notifications.
- Pauses now show the estimated time remaining in the status bar.

### Fixed

- Fixed incorrect time when a session has previously been paused.
- Removed an invalid tag.

### Changed

- Now uses the new Hack Hour API.
- Background refactoring of code to improve future development.
- Removed verbose warning notifications, still visible in console.
- The timer is now synced with hakkuun.
- Errors are now all recoverable.
- Tweaked sensitivity of start reminder notifications.
- Specific notification now exist for when you pause and resume a session.
- Extension is now bundled.

## [0.5.3] - 2024-06-22

### Fixed

- The extension no longer errors on startup if the user had not set their Slack ID.

### Changed

- Improved the README with more information.
- Removed unused code.

## [0.5.2] - 2024-06-21

### Added

- Notifications for when the session starts/ends.
- Reminders for you to start your session when you start typing.
- Configuration settings via VS Code's built-in configuration system.

### Fixed

- An session ending early unexpectedly will cause requests to be spammed.
- Fixed the version in the changelog.

### Changed

- Added a more robust error handling system. You no longer need to restart VS Code in most cases.
- Made the extension icon's background transparent.

## [0.5.1] - 2024-06-18

### Fixed

- Resolve module issues by using `axios` instead of `node-fetch`.

### Changed

- Removed hard-coded Slack channel url.

## [0.5.0] - 2024-06-18

### Added

- Initial release of the extension.
- Added the ability to track hack hour times in the status bar.

[0.6.2]: https://github.com/samdev-7/arcade-vsc/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/samdev-7/arcade-vsc/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/samdev-7/arcade-vsc/compare/v0.5.3...v0.6.0
[0.5.3]: https://github.com/samdev-7/arcade-vsc/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/samdev-7/arcade-vsc/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/samdev-7/arcade-vsc/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/samdev-7/arcade-vsc/releases/tag/v0.5.0