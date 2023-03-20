<p align="center">
    <h1 align="center">ACDL Language Server for ASK Toolkit</h1>
</p>

The Alexa Conversations Descriptive Language (ACDL) Language Server for the Alexa Skills Toolkit for Visual Studio Code (VS Code) extension provides language assistance for developers writing ACDL documents in VS Code. 

See the [official developer documentation](https://developer.amazon.com/en-US/docs/alexa/ask-toolkit/vs-code-acdl.html) for more information about the included features, as well as information about developing ACDL skills.

> **Note**: The ASK Toolkit for VS Code includes the most current version of the ACDL compiler. If your skill uses an older version of the compiler, you might see differences between the realtime validations that the extension provides and the errors and warnings from the compiler.

## Features

- **Code Suggestion and Auto-Completion**
    - Suggestions and auto-completion are available for many ACDL actions and types, including built-in and user-defined Actions, Slot Types, and ACDL Keywords. Suggestions are contextual and ACDL type-aware.

- **Hover Tooltips**
    - Hovering over an ACDL symbol gives you type and declaration information about the symbol. Holding Command (Mac) or Ctrl (PC) and hovering also displays definition information, where available, in the tooltip.
    - Tooltips for APLA documents include any content strings associated with the document.
    - Holding Command/Ctrl and hovering over an `UtteranceEvent` will display the utterance samples for that `UtteranceEvent`.


- **Go-to Definition and Peek Definition** 
    - You can use the VS Code go-to definition and peek definition operations to view definition information of many symbols in ACDL including actions, utterance sets, user-defined types, and APL/APLA documents. 
    - You can use the VS Code go-to type definition and peek type definition operations to view type definitions for symbols that have an associated type, such as utterance sets.

- **Debug with Realtime Validation**
    - With real-time validation, ACDL compiler validations are run as you are writing ACDL, and you can see ACDL errors and warnings rendered in line with red and yellow wavy lines beneath statements that are incorrect or could cause a problem.
    - You can also view all validation errors in the VS Code `Problems` panel (**View** -> **Problems**).

## Configuration Options

- **Enable fully qualified namespaces**

    - By default, the VS Code editor displays names without the namespace qualifier. For example, on hover and autocomplete, the editor displays `expect` instead of `com.amazon.alexa.ask.conversations.expect`. To display fully qualified namespaces during editing, enable the namespace setting in your VS Code editor.
    - To enable the namespace setting in the ASK extension: 
        1. In VS Code, on the activity bar, select View > Extensions.
        2. On the Extensions sidebar, under INSTALLED, navigate to the Alexa Skills Kit (ASK) Toolkit extension, and then click the settings gear.
        3. To enable fully qualified namespaces, under Ask Toolkit: `Show Full ACDL Namespace`, click `Show fully qualified namespaces in ACDL Language Features while editing .acdl files`.
        4. Exit VS Code, and then open VS Code.



-----
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
