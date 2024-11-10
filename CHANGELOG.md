# Changelog

All notable changes to the "TODO Code Tracker" extension will be documented in this file.

## Released

## 1.0.0 - 2023-04-28
### Added
- **Autocomplete TODO Comments Feature**: Introduces autocompletion for `TODO-HIGH`, `TODO-MEDIUM`, `TODO-LOW` when you start typing `TODO` in your JavaScript or TypeScript files. This helps in setting the priority of your tasks directly from your code editor.
  
- **Find TODOs Command**: Added a new command that scans your project for all TODO comments and displays them organized by priority in a list. This list is accessible through the Command Palette or the `Ctrl+Alt+T` shortcut on Windows/Linux and `Cmd+Alt+T` on macOS. Clicking on a TODO item in the list will navigate directly to the file and line of the comment.

### Fixed
- No specific fixes in this release as it is the initial launch.

### Known Issues
- The TODO list may not refresh automatically when new TODO comments are added or existing ones are modified. Users may need to manually refresh the list to see updates.


## 2.0.0 - 2024-11-10
### Added
- **Machine Learning Priority Estimation**: Integrated a machine learning model that automatically assigns priority levels to TODO comments without a specified priority keyword. The model infers priority based on the content of each TODO comment, enhancing productivity by reducing manual prioritization. A local inference API has been added, enabling the model to run directly on your machine and serve predictions in real-time, without requiring an internet connection. This allows the extension to operate fully offline while providing intelligent priority suggestions.

### Requirements Update
- **Python and `pip` Version Requirements**: The extension now requires Python > 3.9 and `pip` > 21.2.4 for running the inference model. If these versions are not available, TODO comments without a specified priority keyword will be automatically set to the least priority, consistent with the behavior in version 1.0.0.


### Fixed
- No specific fixes were added in this release.

### Known Issues
- The TODO list may not refresh automatically when new TODO comments are added or existing ones are modified. Users may need to manually refresh the list to see updates.
- Performance of the priority estimation model may vary with larger codebases due to the added computational load from the inference API. Optimization improvements are planned for future releases.

We hope you find the "TODO Code Tracker" extension useful in managing your coding tasks more efficiently!

