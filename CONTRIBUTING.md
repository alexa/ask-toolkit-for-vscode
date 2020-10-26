# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional 
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary 
information to effectively respond to your bug report or contribution.


## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check [existing open](https://github.com/alexa/ask-toolkit-for-vscode/issues), or [recently closed](https://github.com/alexa/ask-toolkit-for-vscode/issues?utf8=%E2%9C%93&q=is%3Aissue%20is%3Aclosed%20), issues to make sure somebody else hasn't already 
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The version of our code being used
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment

To make it easier for you, we already provide an issue template when creating an 
issue. It will be of great use to us if you can follow the template and capture as much detail as possible.


## Contributing via Pull Requests
Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the *development* branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

### Setup steps
Ensure that you have the following installed : 
- NodeJS (preferably 12.x version)
- npm
- typescript
- git
- VSCode IDE

### Steps to contribute
To send us a pull request, please:

1. Fork the repository.
2. Clone your forked repo
````
git clone git@github.com:<your-account>/ask-toolkit-for-vscode.git
````
3. Run `npm install` at the root of the repo, to install the extension 
dependencies.
4. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
5. Run the extension and check if the functionality is working as expected. You 
can use the [`Extension` launch configuration](https://github.com/alexa/ask-toolkit-for-vscode/blob/development/.vscode/launch.json#L6) for running the extension host.
6. Add test cases for your changes.
7. Run the following extension tests and make sure they pass : 
    - [`Extension Tests`](https://github.com/alexa/ask-toolkit-for-vscode/blob/development/.vscode/launch.json#L20) and [`Extension Tests (Coverage)`](https://github.com/alexa/ask-toolkit-for-vscode/blob/development/.vscode/launch.json#L39) launch configurations through the extension. The `Extension Tests` allows you to set up breakpoints in the code but doesn;t generate coverage report. `Extension Tests (Coverage)` will generate test report under {workspace}/coverage but it can't hit any breakpoint.
    - `npm test` using the terminal. Make sure that you close all the vscode instances before running this.
8. Commit your work. Your commit message should follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). We have a pre commit hook to validate the commit message.
9. Send us a pull request, answering any default questions in the pull request interface. The pull request should be going to `development` branch.

## Branch Organization
All new feature requests/bug fixes should be going to the `development` branch. We merge the `development` to `master` branch when we do a release. `master` is always a mirror of the latest version on [vscode marketplace](https://marketplace.visualstudio.com/items?itemName=ask-toolkit.alexa-skills-kit-toolkit).

## Semantic Versioning
We follow semantic versioning. Currently, we are not considering pull requests with breaking changes that would require major version bump. You are welcomed to open Github issues with ideas that require breaking change and we can discuss further on
how to accommodate them.


## Finding contributions to work on
Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels ((enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any ['help wanted'](https://github.com/alexa/ask-toolkit-for-vscode/labels/help%20wanted) issues is a great place to start. 


## Code of Conduct
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct). 
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact 
opensource-codeofconduct@amazon.com with any additional questions or comments.


## Security issue notifications
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.


## Licensing

See the [LICENSE](https://github.com/alexa/ask-toolkit-for-vscode/blob/master/LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.
