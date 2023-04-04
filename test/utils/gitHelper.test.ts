import {existsSync, mkdirSync} from "fs";
import {removeSync} from "fs-extra";
import * as assert from "assert";
import os from "os";
import * as fs from "fs";
import sinon from "sinon";
import * as path from "path";
import {LogLevel} from "../../src/logger";
import {GitInTerminalHelper} from "../../src/utils/gitHelper";
import {SYSTEM_ASK_FOLDER} from "../../src/constants";

describe("GitInTerminalHelper tests", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("init", () => {
    const tmpDir = os.tmpdir();
    const emptyDir = `${tmpDir}/gitHelperTest`;
    beforeEach(() => {
      if (!existsSync(emptyDir)) {
        mkdirSync(emptyDir);
      }
    });

    afterEach(() => {
      if (existsSync(emptyDir)) {
        removeSync(emptyDir);
      }
    });

    it("creates a .git subfolder when initializing a new repository", () => {
      const helper = new GitInTerminalHelper(emptyDir, LogLevel.off);
      helper.init();
      assert.strictEqual(existsSync(`${emptyDir}/.git`), true);
    });
  });

  describe("getCurrentBranch", () => {
    it("returns the branch 'master'", () => {
      const helper = new GitInTerminalHelper("mockRepo", LogLevel.off);
      sandbox.stub(helper, "_execChildProcessSync").returns("master");
      const currentBranch = helper.getCurrentBranch();
      assert.strictEqual(
        currentBranch,
        "master",
        `Current branch not equal to master. Current branch: ${currentBranch}\nRepository location: ${helper.folderPath}`,
      );
    });
  });
});
