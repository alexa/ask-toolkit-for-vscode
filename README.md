<p align="center">
    <img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/avs/docs/ux/branding/mark1._TTH_.png">
    <br/>
    <h1 align="center">Alexa Skills Toolkit for Visual Studio Code</h1>
    <p align="center">
    <a href="https://vsmarketplacebadge.apphb.com/version-short/ask-toolkit.alexa-skills-kit-toolkit.svg"><img src="https://vsmarketplacebadge.apphb.com/version-short/ask-toolkit.alexa-skills-kit-toolkit.svg"></a>
    <a href="https://vsmarketplacebadge.apphb.com/downloads-short/ask-toolkit.alexa-skills-kit-toolkit.svg"><img src="https://vsmarketplacebadge.apphb.com/downloads-short/ask-toolkit.alexa-skills-kit-toolkit.svg"></a>
    <a href="https://vsmarketplacebadge.apphb.com/rating-short/ask-toolkit.alexa-skills-kit-toolkit.svg"><img src="https://vsmarketplacebadge.apphb.com/rating-short/ask-toolkit.alexa-skills-kit-toolkit.svg"></a>
    </p>
</p>

Alexa Skills Toolkit for Visual Studio Code is an extension that makes it easier for you to create, test, and deploy Alexa skills. It provides a dedicated workspace for Alexa Skills in VS Code and provides features for managing and previewing APL documents along with the ability to test and debug your skills in VS Code with local debugging.

See the [getting started documentation](https://developer.amazon.com/docs/ask-toolkit/get-started-with-the-ask-toolkit-for-visual-studio-code.html)

## Requirements

1. To create and deploy Alexa-hosted skills, [download Git](https://git-scm.com/downloads) and install it. We recommend the latest version of `git` to have a seamless experience.
2. Install and configure [VSCode Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python), if you plan to develop skills using python.

> **Note** : [`ASK CLI`](https://developer.amazon.com/en-US/docs/alexa/smapi/quick-start-alexa-skills-kit-command-line-interface.html) is no longer a requirement for the extension and the commands are no longer available in the VSCode Command Palette. Please install and use the `ASK CLI` directly.

## Quick Start

### Sign in to your Amazon Developer account

<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/alexa/ask-toolkit-for-vscode/master/media/docs/sign_in_flow.gif" alt="Sign-In Preview" />
  <br />
</p>


### Create a skill

<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/alexa/ask-toolkit-for-vscode/master/media/docs/create_skill.gif" alt="Create Skill" />
  <br />
</p>

### Create and preview APL documents

<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/alexa/ask-toolkit-for-vscode/master/media/docs/create_apl_doc.gif" alt="Create APL doc" />
  <br />
</p>

### Setup local debugging

<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/alexa/ask-toolkit-for-vscode/master/media/docs/local_debugging.gif" alt="Local debugging" />
  <br />
</p>

### Deploy and build skill

<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/alexa/ask-toolkit-for-vscode/master/media/docs/deploy_skill.gif" alt="Deploy skill" />
  <br />
</p>

----
## Features

- **Set up skill project**
    - Quickly set up an Alexa skill project by creating a skill or downloading an existing skill or opening a local skill. Any skill that follows the [ASK CLI v2 skill structure](https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-intro.html#skill-project-structure) is supported. Use the **Skill Management** tab under the extension, to try these out.
    - Once opened, your skill project will appear under the **Skills** pane in the extension sidebar.

> **Note**: Currently, Alexa Skills Toolkit only supports creation and deployment of Alexa-hosted skills.

- **Build or Download Interaction Model**
    - Edit the Interaction Model JSON under [`Skill Package`](https://developer.amazon.com/en-US/docs/alexa/smapi/skill-package-api-reference.html#skill-package) folder of your skill project. 
    - Alternatively, download the updated Interaction Model JSON from developer console using the **Download** option under **Skills** pane -> **YourAwesomeSkill** -> **Interaction model**.

> **Note**: Currently, only saved and built interaction models can be downloaded from developer console.

- **Build or Download Skill Manifest**
    - Edit the Skill Manifest JSON under [`Skill Package`](https://developer.amazon.com/en-US/docs/alexa/smapi/skill-package-api-reference.html#skill-package) folder of your skill project. 
    - Alternatively, download the updated Skill Manifest JSON from developer console using the **Download** option under **Skills** pane -> **YourAwesomeSkill** -> **Skill manifest**.

- **Create, Download & Preview APL Documents**
    - Create new APL documents using the **Create** option under **Skills** pane -> **YourAwesomeSkill** -> **Alexa Presentation Language (APL)**.
    - Download saved APL documents in the APL Authoring tool, using **Download** option under **Skills** pane -> **YourAwesomeSkill** -> **Alexa Presentation Language (APL)**.
    - Preview APL documents in `Skill Package`, using **Preview** option under **Skills** pane -> **YourAwesomeSkill** -> **Alexa Presentation Language (APL)**. 
    - Optionally, change the viewport of the preview to a different device, using **Change viewport profile** option under **Skills** pane -> **YourAwesomeSkill** -> **Alexa Presentation Language (APL)**.

- **Test & Debug Skills Locally**
    - Add default Node/Python debug configurations in your skill's `launch.json` [debug configuration](https://code.visualstudio.com/docs/editor/debugging) file, install dependencies (`ask-sdk-local-debug`) and start a local debug session. More information can be found on the [getting started documentation](https://developer.amazon.com/docs/alexa/ask-toolkit/vs-code-ask-skills.html#test)

> **Note**: If you are using any existing profiles, we recommend you to recreate them again from the **Skill Management** tab -> hamburger (`...`) menu -> **Profile Manager** view, so that the profile will contain all LWA scopes needed for local debugging. 

- **Deploy your skill**
    - Deploy all *committed* changes in your skill, using the **Deploy & Build** option under **Skills** pane -> **YourAwesomeSkill**. 

> **Note**: Currently, Alexa Skills Toolkit only supports [deployment of Alexa-hosted skills, using Git](https://developer.amazon.com/en-US/docs/alexa/hosted-skills/alexa-hosted-skills-ask-cli.html#deploy-changes-to-your-alexa-hosted-skill-ask-cli-v2). Commit any changes you wish to deploy to your skill's `master` branch. You can use VS Code's built-in [Git support](https://code.visualstudio.com/docs/editor/versioncontrol#_git-support) or any Git client.

- **Documentation**
    - Quickly jump to Alexa Skills Kit docs using the links under **Documentation** pane.

- **Profile Manager**
    - Create or delete profiles using **Profile Manager** under the hamburger menu (`...`) of **Skill Management** pane. 
    - Quickly jump between multiple developer profiles using the `ASK Profile` status bar item.

and many more ...

----

## FAQs

- **How do I setup and configure Alexa Skills Kit Toolkit extension when doing Visual Studio Code Remote Development using SSH?**
    > **Note**: Install [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh) extension on Visual Studio Code, then connect to remote machine over SSH.

    - Install Alexa Skills Kit Toolkit extension on SSH after connecting to remote machine over SSH.
    - Forward port 9090 on Remote-SSH extension, please refer to [Forwarding a port / creating SSH tunnel](https://code.visualstudio.com/docs/remote/ssh#_forwarding-a-port-creating-ssh-tunnel).
    - Click on the Alexa activity tab icon and sign in.

- **What if I failed to sign in Amazon account over SSH remote development?**
    - Please refer to [Forwarding a port / creating SSH tunnel](https://code.visualstudio.com/docs/remote/ssh#_forwarding-a-port-creating-ssh-tunnel) to check whether you have forwarded port 9090.

----

## Got Feedback?

We would like to hear about your bugs, feature requests, questions or quick feedback.

- Write us a [review](https://marketplace.visualstudio.com/items?itemName=ask-toolkit.alexa-skills-kit-toolkit&ssr=false#review-details)
- Upvote 👍 [feature requests](https://github.com/alexa/ask-toolkit-for-vscode/issues?q=is%3Aissue+is%3Aopen+label%3Afeature-request+sort%3Areactions-%2B1-desc)
- [Ask a question](https://github.com/alexa/ask-toolkit-for-vscode/issues/new?labels=guidance&template=guidance_request.md)
- [Request a new feature](https://github.com/alexa/ask-toolkit-for-vscode/issues/new?labels=feature-request&template=feature_request.md)
- [File an issue](https://github.com/alexa/ask-toolkit-for-vscode/issues/new?labels=bug&template=bug_report.md)

-----

## License

The **Alexa Skill Toolkit for VSCode** extension is distributed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). Any marks/logos displayed as part of the extension GUI are **not** licensed under an open source license, but instead subject to Amazon’s Trademark Guidelines, available [here](https://developer.amazon.com/support/legal/tuabg#trademark).


## Data & Telemetry

The **Alexa Skill Toolkit for VSCode** extension collects usage data and sends it to Amazon to help improve our products and services. This extension respects the `Ask: Telemetry Enabled` / `ask.telemetryEnabled` setting under the extension settings.