## 2.1.0 - September 22, 2020

- Adds local simulator features in the toolkit.
- Adds "What's new" screen in the toolkit, shown to users when extension is
 updated.
- Adds a "Contact Alexa" status bar option, to provide easier feedback options
 to toolkit users.
- Updated resolution of readme gifs, for better visibility.
- Fixed the workspace helper to add skills in current workspace, without
 deleting earlier folders. Fixes #21.
- Fixes the iconpath on toolkit webviews.

## 2.0.2 - Sep 03, 2020

- Revert extension main class on package.json file.

## 2.0.1 - Sep 02, 2020

- Adds folder overwrite options for clone skill flow, if skill already exists
locally.
- Sets additional telemetry information on the URL links.
- Fixes some linter issues.
- Improves some log messages in the workflows.

## 2.0.0 - Jul 21, 2020

- Adds 'ASK Toolkit' container in side bar, containing skill management, 
skill actions & documentation views.
- Adds support for syncing interaction model, skill manifest, APL documents from
developer console.
- Adds local APL-Preview functionality in skill actions.
- Adds local debugging configuration support for Node/Python based alexa skills.
- Adds opt-out telemetry support in the extension.
- Removed `ask-cli` dependency and wrapper functions from command palette.

## 1.0.3 - Apr 15, 2020

- Updated Error message prompt and docs to mention explicit ASK CLI v1 version dependency.

## 1.0.2 - Sep 26, 2019

- Deprecate opn module and change to open module.
- Move the latest manifest json validation schema to new s3 bucket.

## 1.0.1 - Feb 10, 2019

- Support one high level command: ask dialog.
- Support some low level commands in beta-test and catalog category.
- Add a new snippet for a new AMAZON built-in intent: SelectIntent.

## 1.0.0 - Nov 20, 2018

- Added UI for runtime selection (Python / Node.js) when creating a new skill.
- Added Python SDK Snippets suggestions.
- ASK toolkit is now Generally Available.
