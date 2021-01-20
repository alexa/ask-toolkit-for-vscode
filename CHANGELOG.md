# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.



## 2.2.0 (2020-11-19)


### Features

* add default aws region for create hosted skill ([#51](https://github.com/alexa/ask-toolkit-for-vscode/issues/51)) ([5298da3](https://github.com/alexa/ask-toolkit-for-vscode/commits/5298da34a690552f12f3a37f08f0eda0cfee1ae5))
* add dynamic content to welcome screen ([#63](https://github.com/alexa/ask-toolkit-for-vscode/issues/63)) ([30dad54](https://github.com/alexa/ask-toolkit-for-vscode/commits/30dad54bdf347df300823c8fea5c12469e1a21d4))
* update debug configuration snippet in package.json with a choice region input ([#55](https://github.com/alexa/ask-toolkit-for-vscode/issues/55)) ([feeac28](https://github.com/alexa/ask-toolkit-for-vscode/commits/feeac281d2cb30d5fcceb133b510c9a30f48da9c))


### Bug Fixes

* iconpath for quick input button for vscode 1.51.1, update package lock and tests for new version ([a6d5f0a](https://github.com/alexa/ask-toolkit-for-vscode/commits/a6d5f0aec11bcfd520530dcb4787a83f10f4512f))
* Portugese (BR) to Portuguese (BR) ([#43](https://github.com/alexa/ask-toolkit-for-vscode/issues/43)) ([cf3412a](https://github.com/alexa/ask-toolkit-for-vscode/commits/cf3412ae385341ba1017d7f05db917642f30753d))
* Revert main class on package to fix extension run ([99de11e](https://github.com/alexa/ask-toolkit-for-vscode/commits/99de11e9544a43cc28f831ba6819c8a9796ee995))
* simulateSkillHelper file into three smaller helper files ([#44](https://github.com/alexa/ask-toolkit-for-vscode/issues/44)) ([322573d](https://github.com/alexa/ask-toolkit-for-vscode/commits/322573da141370a38b46fde486dadb737c273fc2))
* upgrade yargs-parser version in package-lock.json ([#48](https://github.com/alexa/ask-toolkit-for-vscode/issues/48)) ([462cea4](https://github.com/alexa/ask-toolkit-for-vscode/commits/462cea469e97cf2c1ec9620867028935c2ed7233))
* working dir not assigned issue in git helper ([#56](https://github.com/alexa/ask-toolkit-for-vscode/issues/56)) ([be467b2](https://github.com/alexa/ask-toolkit-for-vscode/commits/be467b2c5fb151a9f6513dab278539a5d19d1913))

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
