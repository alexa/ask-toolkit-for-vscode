import * as vscode from "vscode";
import * as assert from "assert";
import * as sinon from "sinon";
import * as model from "ask-smapi-model";
import { CustomSmapiClientBuilder } from "ask-smapi-sdk";

import { ListSkillsCommand } from "../../../src/askContainer/commands/listSkills";
import { SmapiClientFactory, SmapiResource } from "../../../src/runtime";
import * as profileHelper from "../../../src/runtime/lib/utils/profileHelper";
import { stubTelemetryClient } from '../../../test/testUtilities';

describe("Command ask.container.listSkills", () => {
    let command: ListSkillsCommand;
    let sandbox: sinon.SinonSandbox;
    const fakeSmapiInstance = new CustomSmapiClientBuilder()
        .withRefreshTokenConfig({ clientId: "", clientSecret: "", refreshToken: "" })
        .client();
    before(() => {
        command = new ListSkillsCommand();
    });
    after(() => {
        command.dispose();
    });
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        stubTelemetryClient(sandbox);
        sandbox.stub(profileHelper, "resolveVendorId").returns("fakeVendorId");
        sandbox.stub(profileHelper, "getCachedProfile").returns(undefined);
        sandbox.stub(SmapiClientFactory, "getInstance").returns(fakeSmapiInstance);
    });

    afterEach(() => {
        sandbox.restore();
    });
    it("Constructor should work as expected", () => {
        assert.strictEqual(command.title, "ask.container.listSkills");
        assert.strictEqual(command.command, "ask.container.listSkills");
    });

    it("Should be able to return full list of skills", async () => {
        const fakeSkillOne = {
            skillId: "1",
            nameByLocale: {
                "en-US": "FirstSkill",
            },
        };
        const fakeSkillTwo = {
            skillId: "2",
            nameByLocale: {
                "en-US": "SecondSkill",
            },
        };
        const fakeListSkillResponse: model.v1.skill.ListSkillResponse = {
            skills: [fakeSkillOne, fakeSkillTwo],
        };
        sandbox.stub(fakeSmapiInstance, "listSkillsForVendorV1").returns(fakeListSkillResponse);
        const skills = await vscode.commands.executeCommand("ask.container.listSkills");
        const expectedResult = [
            new SmapiResource(fakeSkillOne, "FirstSkill"),
            new SmapiResource(fakeSkillTwo, "SecondSkill"),
        ];
        assert.deepStrictEqual(skills, expectedResult);
    });

    it("When en-US locale is not present, should use the first name in the list", async () => {
        const fakeSkillOne = {
            skillId: "1",
            nameByLocale: {
                "fr-FR": "FirstSkill",
                "ja-JP": "Foo",
            },
        };
        const fakeSkillTwo = {
            skillId: "2",
            nameByLocale: {
                "en-US": "SecondSkill",
            },
        };
        const fakeListSkillResponse: model.v1.skill.ListSkillResponse = {
            skills: [fakeSkillOne, fakeSkillTwo],
        };
        sandbox.stub(fakeSmapiInstance, "listSkillsForVendorV1").returns(fakeListSkillResponse);
        const skills = await vscode.commands.executeCommand("ask.container.listSkills");
        const expectedResult = [
            new SmapiResource(fakeSkillOne, "FirstSkill"),
            new SmapiResource(fakeSkillTwo, "SecondSkill"),
        ];
        assert.deepStrictEqual(skills, expectedResult);
    });

    it("When nameByLocale is missing, use the default name", async () => {
        const fakeSkillOne = {
            skillId: "1",
            nameByLocale: {},
        };
        const fakeListSkillResponse: model.v1.skill.ListSkillResponse = {
            skills: [fakeSkillOne],
        };
        sandbox.stub(fakeSmapiInstance, "listSkillsForVendorV1").returns(fakeListSkillResponse);
        const skills = await vscode.commands.executeCommand("ask.container.listSkills");
        const expectedResult = [new SmapiResource(fakeSkillOne, "someSkill")];
        assert.deepStrictEqual(skills, expectedResult);
    });
});
