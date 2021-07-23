# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.7.0](https://github.com/alexa/ask-toolkit-for-vscode/compare/v2.6.0...v2.7.0) (2021-07-23)


### Features

* set node.js 12 as default hosted skill node.js runtime version ([#138](https://github.com/alexa/ask-toolkit-for-vscode/issues/138)) ([cd374c5](https://github.com/alexa/ask-toolkit-for-vscode/commits/cd374c53db447f7c7ba69e3c9ff1d0db07cea1b9))


### Bug Fixes

* update package-lock.json to update trim-lines security patch ([#137](https://github.com/alexa/ask-toolkit-for-vscode/issues/137)) ([f31ece4](https://github.com/alexa/ask-toolkit-for-vscode/commits/f31ece49d203bf791208531b5836cc3b6057f04f))

## [2.6.0](https://github.com/alexa/ask-toolkit-for-vscode/compare/v2.5.0...v2.6.0) (2021-06-01)


### Features

* upgrade APL 1.5 to 1.6 with APL Web Viewhost and APL Suggester. ([#122](https://github.com/alexa/ask-toolkit-for-vscode/issues/122)) ([e350c52](https://github.com/alexa/ask-toolkit-for-vscode/commits/e350c52351eb159af8af50bcb80027a127547653))


### Bug Fixes

* consolidate deploy webviews messages in the constants file ([#117](https://github.com/alexa/ask-toolkit-for-vscode/issues/117)) ([4b97b79](https://github.com/alexa/ask-toolkit-for-vscode/commits/4b97b797eb98bf05d974c941d999957047cc4169))
* update webview forms to not redirect after submission ([#127](https://github.com/alexa/ask-toolkit-for-vscode/issues/127)) ([987eb1a](https://github.com/alexa/ask-toolkit-for-vscode/commits/987eb1add8363a46ab33e47f7c3e508a495342df)), closes [#123](https://github.com/alexa/ask-toolkit-for-vscode/issues/123) [#124](https://github.com/alexa/ask-toolkit-for-vscode/issues/124)

## [2.5.0](https://github.com/alexa/ask-toolkit-for-vscode/compare/v2.4.0...v2.5.0) (2021-03-30)


### Features

* support apl touch events in simulator ([#115](https://github.com/alexa/ask-toolkit-for-vscode/issues/115)) ([55bb816](https://github.com/alexa/ask-toolkit-for-vscode/commits/55bb8163c6d51f805c72e27e65ea2055d6506a44))


### Bug Fixes

* 'resource not found' when cloning a skill ([#101](https://github.com/alexa/ask-toolkit-for-vscode/issues/101)) ([7fd5c4f](https://github.com/alexa/ask-toolkit-for-vscode/commits/7fd5c4f985be844c94ef25eb69ab5b645f45d8e5))
* add license and copyright in source files ([#113](https://github.com/alexa/ask-toolkit-for-vscode/issues/113)) ([f6daa74](https://github.com/alexa/ask-toolkit-for-vscode/commits/f6daa747dbbfc52085ee9e0aa6c1f3423e2c77f8))
* change Telemetry data global state key name ([086acfe](https://github.com/alexa/ask-toolkit-for-vscode/commits/086acfeeb4f99a4d909ff24b4f922b2db991d16f))
* changed globalState data to be dictionary & add retry for git version ([657fa9f](https://github.com/alexa/ask-toolkit-for-vscode/commits/657fa9f24320b09bcd4f4a47a05ccec86cc2d0c5))
* load webview dynamic content when firing for first time ([#105](https://github.com/alexa/ask-toolkit-for-vscode/issues/105)) ([6b9ff2c](https://github.com/alexa/ask-toolkit-for-vscode/commits/6b9ff2caae5f225bd61436f5d6b7888234cd98c2))
* make telemetryClient singleton & add metrics fields ([9428158](https://github.com/alexa/ask-toolkit-for-vscode/commits/9428158d079368cf7f322022f2e7d6bf07b9ae64))

## [2.4.0](https://github.com/alexa/ask-toolkit-for-vscode/compare/v2.3.0...v2.4.0) (2021-02-19)


### Features

* acdl syntax highlighter ([#103](https://github.com/alexa/ask-toolkit-for-vscode/issues/103)) ([2a7f755](https://github.com/alexa/ask-toolkit-for-vscode/commits/2a7f7557bac1e9328bf383e31f4afd1b1e42650c))
* support APL ExecuteCommands directive in toolkit simulator ([5358146](https://github.com/alexa/ask-toolkit-for-vscode/commits/5358146b88232b0d1ddaf1450e442feaffb0ba5b))
* upgrade apl-suggester and apl-viewhost-web to version 1.5 ([#87](https://github.com/alexa/ask-toolkit-for-vscode/issues/87)) ([870e0dc](https://github.com/alexa/ask-toolkit-for-vscode/commits/870e0dc1f86e97b1a89bd8cd288f4b84ffe1d5db))


### Bug Fixes

* add persistence option for webview ([0a090ee](https://github.com/alexa/ask-toolkit-for-vscode/commits/0a090eeefb5d8a1c2cc36a41043e19961af9b101))
* bugs of simulate APL preview ([8baceac](https://github.com/alexa/ask-toolkit-for-vscode/commits/8baceac807137cfbe27066859c18f8895873284f))
* filter unused APL sample templates ([#95](https://github.com/alexa/ask-toolkit-for-vscode/issues/95)) ([1599725](https://github.com/alexa/ask-toolkit-for-vscode/commits/159972567044478efb29af61ea195db346d37fcf))
* passing command line arguments to npm script in package.json ([#88](https://github.com/alexa/ask-toolkit-for-vscode/issues/88)) ([ef3ab18](https://github.com/alexa/ask-toolkit-for-vscode/commits/ef3ab18130a2aeab149ece8366131b1c45ed7e87))
* render apl response without speak tag in simulator. fixes [#82](https://github.com/alexa/ask-toolkit-for-vscode/issues/82) ([#92](https://github.com/alexa/ask-toolkit-for-vscode/issues/92)) ([e9190e0](https://github.com/alexa/ask-toolkit-for-vscode/commits/e9190e0fe79080a5e8028886f0ee70306e127b90))
* unit tests to match ext host error message ([a2470be](https://github.com/alexa/ask-toolkit-for-vscode/commits/a2470be9485090c0697ccd841f46453c91aca81f))
* update PR template with sections & license ([6ae7b7d](https://github.com/alexa/ask-toolkit-for-vscode/commits/6ae7b7dd651aa33cf1ed2871bdc7b88a9b4e1e82))
* use spread operator ([274e598](https://github.com/alexa/ask-toolkit-for-vscode/commits/274e598b2d6cf3818200f0e6706de0b8deeb1160))

## 2.3.0 (2021-01-20)


### Features

* add default aws region for create hosted skill ([#51](https://github.com/alexa/ask-toolkit-for-vscode/issues/51)) ([5298da3](https://github.com/alexa/ask-toolkit-for-vscode/commits/5298da34a690552f12f3a37f08f0eda0cfee1ae5))
* add dynamic content to welcome screen ([#63](https://github.com/alexa/ask-toolkit-for-vscode/issues/63)) ([30dad54](https://github.com/alexa/ask-toolkit-for-vscode/commits/30dad54bdf347df300823c8fea5c12469e1a21d4))
* Add telemetry for hosted skills clone, open URLs, and SMAPI user agent ([#34](https://github.com/alexa/ask-toolkit-for-vscode/issues/34)) ([bd1f8d8](https://github.com/alexa/ask-toolkit-for-vscode/commits/bd1f8d88b443f582ad020a3347d5feacf512751c))
* setup test config ([#32](https://github.com/alexa/ask-toolkit-for-vscode/issues/32)) ([2734416](https://github.com/alexa/ask-toolkit-for-vscode/commits/27344165eb279df540eca9a4f94ce5ef54e9be98))
* support self-hosted skills creation, downloading and deployment & the skill-package folder structure validation ([9042645](https://github.com/alexa/ask-toolkit-for-vscode/commits/9042645f078a42edd4c48f4da863360c67b1be52))
* update debug configuration snippet in package.json with a choice region input ([#55](https://github.com/alexa/ask-toolkit-for-vscode/issues/55)) ([feeac28](https://github.com/alexa/ask-toolkit-for-vscode/commits/feeac281d2cb30d5fcceb133b510c9a30f48da9c))


### Bug Fixes

* add condition to apl renderer content for invalid parameter names ([#71](https://github.com/alexa/ask-toolkit-for-vscode/issues/71)) ([8688491](https://github.com/alexa/ask-toolkit-for-vscode/commits/8688491da024690987f873b8817aa1f7ac91d625))
* Change manifest json validatio's s3 bucket to a new one which host the latest schema ([d9a5f3c](https://github.com/alexa/ask-toolkit-for-vscode/commits/d9a5f3cdd5f86455f99f0f80bfe7af048f0c6f86))
* Change manifest json validation's s3 bucket ([e5f074f](https://github.com/alexa/ask-toolkit-for-vscode/commits/e5f074f1789bace731a75946997f5e3ad715a684))
* Change permissions on credentials file, set run scripts correctly ([#33](https://github.com/alexa/ask-toolkit-for-vscode/issues/33)) ([516a207](https://github.com/alexa/ask-toolkit-for-vscode/commits/516a20734d18d45fc6e063d18acee3f61d944bd7))
* configure current working directory to skill code folder ([#81](https://github.com/alexa/ask-toolkit-for-vscode/issues/81)) ([4353639](https://github.com/alexa/ask-toolkit-for-vscode/commits/4353639f4da111d0a8ca267afec0aaf450693c42))
* fix some contidition checker ([65b052e](https://github.com/alexa/ask-toolkit-for-vscode/commits/65b052ea2385679a95e8c4dd5cb81aa636affe1e))
* fix some lint issues ([a003424](https://github.com/alexa/ask-toolkit-for-vscode/commits/a003424151d073596c1727b4b6ac5d2930a7896e))
* fix some lint issues ([203004a](https://github.com/alexa/ask-toolkit-for-vscode/commits/203004ae1c323508a61fcd86048cfb619de8709a))
* fix testRunner script and revert some await usage ([#35](https://github.com/alexa/ask-toolkit-for-vscode/issues/35)) ([33bfe3b](https://github.com/alexa/ask-toolkit-for-vscode/commits/33bfe3b5c7be79ba66ff5abc38555a504f92e845))
* fix the activate extension unit test ([0c6ef67](https://github.com/alexa/ask-toolkit-for-vscode/commits/0c6ef67c1a7bb1252bdf5bab4d06ac877d0cb74e))
* fix the date of the release. ([4448e28](https://github.com/alexa/ask-toolkit-for-vscode/commits/4448e283e96abaad5aee906bd4d32e93777a09a8))
* iconpath for quick input button for vscode 1.51.1, update package lock and tests for new version ([a6d5f0a](https://github.com/alexa/ask-toolkit-for-vscode/commits/a6d5f0aec11bcfd520530dcb4787a83f10f4512f))
* Portugese (BR) to Portuguese (BR) ([#43](https://github.com/alexa/ask-toolkit-for-vscode/issues/43)) ([cf3412a](https://github.com/alexa/ask-toolkit-for-vscode/commits/cf3412ae385341ba1017d7f05db917642f30753d))
* removed .DS_Store ([88b5792](https://github.com/alexa/ask-toolkit-for-vscode/commits/88b57929333854e77ece44761e9c28756fb2d703))
* render all parameters from apl doc ([650d267](https://github.com/alexa/ask-toolkit-for-vscode/commits/650d2671dfba5597a9a010b32cfb210e6c72ffde))
* Revert main class on package to fix extension run ([99de11e](https://github.com/alexa/ask-toolkit-for-vscode/commits/99de11e9544a43cc28f831ba6819c8a9796ee995))
* simulateSkillHelper file into three smaller helper files ([#44](https://github.com/alexa/ask-toolkit-for-vscode/issues/44)) ([322573d](https://github.com/alexa/ask-toolkit-for-vscode/commits/322573da141370a38b46fde486dadb737c273fc2))
* the hard code path in the skill-package watcher unit tests ([1d30a75](https://github.com/alexa/ask-toolkit-for-vscode/commits/1d30a750d099b40859d4bad554a74c894f96fe6f))
* unit tests timeout of 20000ms exceeded on windows ([ad779fb](https://github.com/alexa/ask-toolkit-for-vscode/commits/ad779fb958d6e9d70cd7704cbef91cbd9a30af8e))
* upgrade yargs-parser version in package-lock.json ([#48](https://github.com/alexa/ask-toolkit-for-vscode/issues/48)) ([462cea4](https://github.com/alexa/ask-toolkit-for-vscode/commits/462cea469e97cf2c1ec9620867028935c2ed7233))
* working dir not assigned issue in git helper ([#56](https://github.com/alexa/ask-toolkit-for-vscode/issues/56)) ([be467b2](https://github.com/alexa/ask-toolkit-for-vscode/commits/be467b2c5fb151a9f6513dab278539a5d19d1913))

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
