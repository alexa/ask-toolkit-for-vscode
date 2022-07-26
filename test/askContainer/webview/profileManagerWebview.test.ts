/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {ProfileManagerWebview} from "../../../src/askContainer/webViews/profileManagerWebview";
import {FakeExtensionContext, FakeWebviewPanelOnDidChangeViewStateEvent} from "../../testUtilities";
import {EXTENSION_STATE_KEY} from "../../../src/constants";

describe("Webview_deploySkill tests", () => {
  let webView: ProfileManagerWebview;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("When message is deleteProfile, should display error message if profileName equals current profile", async () => {
    const fakeContext = FakeExtensionContext.getFakeExtContext();
    fakeContext.globalState.update(EXTENSION_STATE_KEY.LWA_PROFILE, "fakeProfileName");
    webView = new ProfileManagerWebview("fakeTitle", "fakeID", fakeContext);

    const message = {deleteProfile: "fakeProfileName"};
    const spy = sinon.spy(vscode.window, "showErrorMessage");

    await webView.onReceiveMessageListener(message);
    assert.deepStrictEqual(true, spy.called);
  });
});
