/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as assert from "assert";
import fs from "fs";
import jsonfile from "jsonfile";
import os from "os";
import * as path from "path";
import * as sinon from "sinon";
import * as jsonUtility from "../../../src/runtime/lib/utils/jsonUtility";
import {createConfigFileIfNotExists, listExistingProfileNames} from "../../../src/runtime/lib/utils/profileHelper";

describe("ProfileHelper tests", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Function listExistingProfileNames tests", () => {
    it("Should return null when askConfig not exist", () => {
      sandbox.stub(fs, "existsSync").returns(false);
      assert.strictEqual(listExistingProfileNames(), null);
    });

    it("Should return null when no profile in askConfig", () => {
      const fakeConfig = {
        profiles: {},
      };
      sandbox.stub(fs, "existsSync").returns(true);
      sandbox.stub(jsonUtility, "read").returns(fakeConfig);
      assert.strictEqual(listExistingProfileNames(), null);
    });

    it("Should be able to list all exist profiles in askConfig", () => {
      const fakeConfig = {
        profiles: {
          foo: {},
          bar: {},
        },
      };
      sandbox.stub(fs, "existsSync").returns(true);
      sandbox.stub(jsonUtility, "read").returns(fakeConfig);
      assert.deepStrictEqual(listExistingProfileNames(), ["foo", "bar"]);
    });
  });

  describe("Function createConfigFileIfNotExists tests", () => {
    it("Should be able to create .ask folder and config file when both of them are not exist", () => {
      sandbox.stub(os, "homedir").returns("foo");
      sandbox.stub(fs, "existsSync").returns(false);
      const mkdirSpy = sandbox.stub(fs, "mkdirSync");
      const writeFileSpy = sandbox.stub(jsonfile, "writeFileSync");

      createConfigFileIfNotExists();
      assert.ok(mkdirSpy.calledOnceWith(path.join("foo", ".ask")));
      assert.ok(writeFileSpy.calledOnceWith(path.join("foo", ".ask", "cli_config"), {profiles: {}}, {spaces: 2, mode: "0600"}));
    });

    it("Should only create config file when only folder is exist", () => {
      sandbox.stub(os, "homedir").returns("foo");
      const existsSyncStub = sandbox.stub(fs, "existsSync");
      existsSyncStub.withArgs(path.join("foo", ".ask")).returns(true);
      existsSyncStub.withArgs(path.join("foo", ".ask", "cli_config")).returns(false);
      const mkdirSpy = sandbox.stub(fs, "mkdirSync");
      const writeFileSpy = sandbox.stub(jsonfile, "writeFileSync");

      createConfigFileIfNotExists();
      assert.ok(mkdirSpy.notCalled);
      assert.ok(writeFileSpy.calledOnceWith(path.join("foo", ".ask", "cli_config"), {profiles: {}}, {spaces: 2, mode: "0600"}));
    });

    it("Do nothing when both folder and config file exist", () => {
      sandbox.stub(os, "homedir").returns("foo");
      const existsSyncStub = sandbox.stub(fs, "existsSync");
      existsSyncStub.withArgs(path.join("foo", ".ask")).returns(true);
      existsSyncStub.withArgs(path.join("foo", ".ask", "cli_config")).returns(true);
      const mkdirSpy = sandbox.stub(fs, "mkdirSync");
      const writeFileSpy = sandbox.stub(jsonfile, "writeFileSync");

      createConfigFileIfNotExists();
      assert.ok(mkdirSpy.notCalled);
      assert.ok(writeFileSpy.notCalled);
    });
  });
});
