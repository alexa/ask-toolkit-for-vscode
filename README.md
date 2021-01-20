<p align="center">
    <img src="https://d34a6e1u0y0eo2.cloudfront.net/media/images/alexa.png">
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

### Test skill through local simulator

<p align="center">
  <br />
  <img src="https://d34a6e1u0y0eo2.cloudfront.net/media/docs/simulator.gif" alt="Local simulator" />
  <br />
</p>


### Deploy and build skill

#### Deploy an Alexa hosted skill
<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/alexa/ask-toolkit-for-vscode/master/media/docs/deploy_hosted_skill.gif" alt="Deploy Alexa hosted skill" />
  <br />
</p>

#### Deploy a self hosted skill
<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/alexa/ask-toolkit-for-vscode/master/media/docs/deploy_self_hosted_skill.gif" alt="Deploy self hosted skill" />
  <br />
</p>

----
## Features

- **Set up skill project**
    - Quickly set up an Alexa skill project by creating a skill or downloading an existing skill or opening a local skill. Any skill that follows the [ASK CLI v2 skill structure](https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-intro.html#skill-project-structure) is supported. Use the **Skill Management** tab under the extension, to try these out.
    - Once opened, your skill project will appear under the **Skills** pane in the extension sidebar.
    - Alexa Skills Toolkit supports creation of both Alexa-hosted and self-hosted skills. To create a self-hosted skill, you can select **Provision your own** to host your skill's backend resources.

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
    - Simulate alexa requests through local simulator in the extension.
    - Save and replay the simulate session through the local simulator.

> **Note**: If you are using any existing profiles, we recommend you to recreate them again from the **Skill Management** tab -> hamburger (`...`) menu -> **Profile Manager** view, so that the profile will contain all LWA scopes needed for local debugging. 

- **Deploy your skill**
    - Deploy all changes in your skill, using the **Deploy skill** option under the **Skills** pane -> **YourAwesomeSkill**. 
    - A skill must be synchronized with changes made in the console in order to deploy. The **Skill deploy status overview** displays skill local changes and the skill remote sync status to guide you how to successfully deploy. 
    - Alexa Skills Toolkit supports [deployment of Alexa-hosted skills, using Git](https://developer.amazon.com/en-US/docs/alexa/hosted-skills/alexa-hosted-skills-ask-cli.html#deploy-changes-to-your-alexa-hosted-skill-ask-cli-v2). Commit any changes you wish to deploy to your skill's `master` branch. You can use VS Code built-in [Git support](https://code.visualstudio.com/docs/editor/versioncontrol#_git-support) or any Git client.
    - Alexa Skills Toolkit also supports the deployment of self-hosted skills. However, only the skill package can be deployed. Depending on how you source control your code, you can download and deploy skill code from and to an existing Lambda function, S3, or a git repository.

> **Note**: Alexa Skills Toolkit does not support deployment of the skill code for a self-hosted skill, but you can set up your own skill service endpoint in the `skill.json` file. The endpoint will receive POST requests when a user interacts with your Alexa Skills. See `FAQs` for more information.

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

- **Why do I get a prompt for Git credentials when an Alexa hosted skill is created or downloaded?**
    - The git credential is used to access the AWS CodeCommit repository that the hosted skill resides at. This is one of the AWS resources Alexa-hosted skills service provides when creating a skill, explained [here](https://developer.amazon.com/en-US/docs/alexa/hosted-skills/build-a-skill-end-to-end-using-an-alexa-hosted-skill.html#overview). 
    - To get the hosted skills' git credentials, you can call [SMAPI API](https://developer.amazon.com/en-US/docs/alexa/smapi/alexa-hosted-skill.html#generate-credentials) manually, or use the [ASK CLI](https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-command-reference.html#git-credentials-helper) command. The git credentials are short-lived, and need to be refreshed periodically, to keep being able to access the locally cloned hosted skill git.
    - The ASK Toolkit extension is able to automatically configure the credential helper for the hosted skills, and fetch the credentials whenever executing git operations. However, we observed that some specific versions(2.26.x and 2.25.x) of git cannot configure the credential helper properly, leading to the Git credentials prompt. 
    - Therefore, we suggest checking your git version using `git version`. If it is versions 2.25.x or 2.26.x, you need to update to Git >= 2.27.x. This should prevent being asked for Git credentials again. 
    - Otherwise, we suggest you create an issue report.

- **How do I set up my own skill service endpoint for a self-hosted skill?**
    - You can specify your skill's service endpoint by updating the `apis` filed in the `skill.json`. The endpoint will receive POST requests when a user interacts with your Alexa Skills. The JSON snippet below shows how to set up your Lambda endpoint. The code below will set up your endpoint in the `Default Region`.
    ```
    "apis": {
      "custom": {
        "endpoint": {
          "uri": "arn:aws:lambda:us-west-2:123456789012:function:my-function"
        }
      }
    }
    ```
    - Skill endpoints can also be set up in a specific region. For each AWS region, there is an  corresponding optimal ASK region code (`NA`, `EU`, `FE`). See [the best practices in choosing Lambda regions](https://developer.amazon.com/en-US/docs/alexa/custom-skills/host-a-custom-skill-as-an-aws-lambda-function.html#select-the-optimal-region-for-your-aws-lambda-function) for the AWS region codes and corresponding optimal ASK region codes. Using the corresponding optimal codes is recommended and can reduce the overall latency of your skill.
    The JSON snippet below shows how to specify other regions. In this example, the AWS region code is (us-east-1) and the optimal ASK region code is (NA). 
    ```
    "apis": {
      "custom": {
        "endpoint": {
          "uri": "arn:aws:lambda:us-west-2:123456789012:function:my-function"
        }
        "regions": {
          "NA": {
            "endpoint": {
              "uri":"arn:aws:lambda:us-east-1:123456789012:function:my-function"
            }
          },
        }
      }
    }
    ```
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
