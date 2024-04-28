# TODO Code Tracker Extension

"TODO Code Tracker" extension is designed to help developers manage and prioritize TODO comments in their JavaScript and TypeScript projects in Visual Studio Code.

## Features

TODO Prioritizer enhances your productivity by providing two key features:

- **Autocomplete TODO Comments**: Automatically suggests `TODO-HIGH`, `TODO-MEDIUM`, or `TODO-LOW` as you type `TODO` in your code, allowing you to set the priority of your task directly.

- **Find TODOs Command**: Scans your project for all TODO comments and displays them in a list, organized by priority. This list is accessible via the Command Palette, and clicking on a TODO item will navigate you directly to the file and line where the TODO comment is written.

### Screenshots

#### Autocomplete Feature
![Autocomplete Feature](images/autocomplete.png)

#### Find TODOs Command
![Find TODOs List](images/find-todos.png)


## Requirements

This extension doesn't have any particular prerequisites other than requiring Visual Studio Code to be installed. It works seamlessly with the most recent versions of Visual Studio Code, more precisely with version 1.80.0 and higher.

## Extension Settings

Currently, the TODO Code Tracker does not require any specific settings adjustments. It works out of the box with the default configuration.

## Known Issues

- Occasionally, the TODO list may not refresh automatically if TODO comments are added or modified. A manual refresh of the list might be necessary.

## Release Notes
### 1.0.0

Initial release of TODO Code Tracker.

- Autocomplete for `TODO-HIGH`, `TODO-MEDIUM`, `TODO-LOW`.
- New command "Find TODOs" that lists and prioritizes TODO comments in your project.

**Enjoy using TODO Code Tracker to efficiently manage and navigate your coding tasks!**
