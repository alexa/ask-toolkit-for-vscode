/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as model from 'ask-smapi-model';
import * as retry from 'async-retry';
import * as path from 'path';
import * as vscode from 'vscode';
import { DEFAULT_PROFILE, SKILL } from '../../constants';
import { AskError, logAskError } from '../../exceptions';
import { Logger } from '../../logger';
import { SkillInfo } from '../../models/types';
import { AbstractCommand, CommandContext, SmapiClientFactory, SmapiResource, Utils } from '../../runtime';
import { getImagesFolder } from '../../utils/mediaHelper';
import {
    clearCachedSkills, getCachedSkills,
    getSkillMetadata, getSkillNameFromLocales, setCachedSkills
} from '../../utils/skillHelper';

import skillSummary = model.v1.skill.SkillSummary;
import hostedSkillMetadata = model.v1.skill.AlexaHosted.HostedSkillMetadata;

const AlexaHostedProvision = 'Alexa-hosted';

const ALL_SKILLS_QUICK_PICK_TITLE = 'All skills';
const SKILL_RETRIEVAL_PLACEHOLDER = 'Getting the list of skills...';
const SKILL_NOT_FOUND = 'No Alexa custom skills found under profile. Please create one first.';
const SKILL_RETRIEVAL_FAILED = 'Alexa skills retrieval failed.';
const VIEW_ALL_SKILLS_LAST_UPDATE_TIME = 'viewAllSkillsLastUpdateTime';
const NUMBER_OF_INTERVALS = 1;
const HOUR = 3600000;

export class ViewAllSkillsCommand extends AbstractCommand<void> {
    private skillInfoMap: Map<string, SmapiResource<SkillInfo>>;
    private skillsList: Array<SmapiResource<SkillInfo>> = new Array<SmapiResource<SkillInfo>>();

    constructor() {
        super('ask.container.viewAllSkills');
        this.skillInfoMap = new Map<string, SmapiResource<SkillInfo>>();
    }

    private async setHostedSkillInfo(): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.setHostedSkillInfo`);
        await this.setSkillsList();

        const retryOptions: retry.Options = {
            retries: 5,
            minTimeout: 1000,
            factor: 1.1,
        };

        let profile = Utils.getCachedProfile(this.context);
        profile = profile ?? DEFAULT_PROFILE;
        const smapiClient = SmapiClientFactory.getInstance(profile, this.context);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await Promise.allSettled(
            this.skillsList.map(async (skill, index) => {
                let skillMetadata;
                try {
                    // Since the retry function will bail out and throw error
                    skillMetadata = await retry(
                        async (bail: (err: Error) => void): Promise<hostedSkillMetadata | undefined> => {
                            try {
                                return await smapiClient.getAlexaHostedSkillMetadataV1(
                                    skill.data.skillSummary.skillId ?? '');
                            } catch (err) {
                                if (err.name === 'ServiceError' && err['statusCode'] === 429) {
                                    throw new AskError(
                                        `API throttled. Retrying after few seconds`);
                                }
                                bail(new AskError(`Skill is not a hosted skill service`))
                                return undefined;
                            }
                        }, retryOptions
                    );
                } finally {
                    skill.data.isHosted = skillMetadata !== undefined;
                    skill.data.hostedSkillMetadata = skillMetadata;
                }
            })
        );
    }

    private async setSkillsList(): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.setSkillsList`);
        let skillsArray: Array<SmapiResource<skillSummary>> | undefined = await vscode.commands.executeCommand(
            'ask.container.listSkills'
        );

        if (skillsArray) {
            this.skillsList = [];
            skillsArray = skillsArray?.sort((skill1, skill2) => {
                if (skill1.data === undefined || skill2.data === undefined) {
                    return 0;
                } else {
                    const skill1Date = new Date(skill1.data.lastUpdated!);
                    const skill2Date = new Date(skill2.data.lastUpdated!);
                    if (skill1Date > skill2Date) {
                        return -1;
                    } else if (skill1Date < skill2Date) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            });

            skillsArray.forEach(skill => {
                this.skillsList.push(
                    new SmapiResource<SkillInfo>(new SkillInfo(skill.data, undefined), skill.data.skillId ?? '')
                );
            });
        }
    }

    private async setQpItems(
        context: vscode.ExtensionContext,
        qp: vscode.QuickPick<vscode.QuickPickItem>
    ): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.setQPItems, args:`, qp);

        qp.items = [];
        qp.busy = true;
        qp.enabled = false;
        qp.placeholder = SKILL_RETRIEVAL_PLACEHOLDER;
        this.skillInfoMap.clear();
        try {
            const cachedSkills = getCachedSkills(context);
            if (!cachedSkills || cachedSkills.length === 0) {
                await this.setHostedSkillInfo();
                setCachedSkills(context, this.skillsList);
            } else {
                this.skillsList = cachedSkills;
            }

            if (this.skillsList.length > 0) {
                this.skillsList.forEach(skill => {
                    this.skillInfoMap.set(getSkillNameFromLocales(skill.data.skillSummary.nameByLocale!), skill);
                });
            }

            const qpItems: vscode.QuickPickItem[] = new Array<vscode.QuickPickItem>();
            this.skillInfoMap.forEach((value: SmapiResource<SkillInfo>, key: string) => {
                const apis = value.data.skillSummary.apis;
                let isCustom = false;
                apis?.forEach(api => {
                    if (api === 'custom') {
                        isCustom = true;
                        return;
                    }
                });
                if (isCustom) {
                    qpItems.push({
                        label: key,
                        description: value.data.isHosted === true ? AlexaHostedProvision : '',
                        detail: value.data.skillSummary.skillId,
                    });
                }
            });
            qp.items = qpItems;
            qp.busy = false;
            qp.placeholder = qpItems.length > 0 ? '' : SKILL_NOT_FOUND;
            qp.enabled = true;
        } catch (err) {
            qp.items = [];
            qp.busy = false;
            qp.placeholder = SKILL_RETRIEVAL_FAILED;
            qp.enabled = true;
            throw logAskError(`${SKILL_RETRIEVAL_FAILED}`, err, true);
        }
    }

    private async checkAndSetQpItems(
        context: vscode.ExtensionContext,
        qp: vscode.QuickPick<vscode.QuickPickItem>
    ): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.checkAndSetQpItems, args:`, qp);
        const previous = context.globalState.get(VIEW_ALL_SKILLS_LAST_UPDATE_TIME) as number;
        const now = new Date().getTime();

        if (previous === undefined || (previous !== undefined && this.calculateTimeExceedHourly(previous, now, NUMBER_OF_INTERVALS))) {
            await this.setLastUpdateTimeAndRefreshList(context, now, qp);
            return;
        }
        await this.setQpItems(context, qp);
    }

    private calculateTimeExceedHourly(previous: number, now: number, limit: number) {
        Logger.verbose(`Calling method: ${this.commandName}.calculateTimeExceedHourly, args:`, previous, now, limit);
        return Math.abs(now - previous) / HOUR >= limit;
    }

    private async setLastUpdateTimeAndRefreshList(context: vscode.ExtensionContext, now: number, qp: vscode.QuickPick<vscode.QuickPickItem>) {
        Logger.verbose(`Calling method: ${this.commandName}.setLastUpdateTimeAndRefreshList, args:`, now, qp);
        void context.globalState.update(VIEW_ALL_SKILLS_LAST_UPDATE_TIME, now);
        clearCachedSkills(context);
        await this.setQpItems(context, qp);
    }
    
    private async skillsQuickPick(context: CommandContext): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.skillsQuickPick`);
        const allSkillsQP = vscode.window.createQuickPick();
        allSkillsQP.title = ALL_SKILLS_QUICK_PICK_TITLE;
        allSkillsQP.canSelectMany = false;
        allSkillsQP.matchOnDescription = true;

        allSkillsQP.onDidChangeValue(() => {
            allSkillsQP.activeItems = [];
        });

        allSkillsQP.onDidAccept(async() => {
            if (allSkillsQP.activeItems.length !== 0) {
                const skillInfo = this.skillInfoMap.get(allSkillsQP.activeItems[0].label)!;
                getSkillMetadata(skillInfo.data.skillSummary.skillId!, SKILL.STAGE.DEVELOPMENT, context.extensionContext)
                    .then(() => {
                        const executeCommand = 'askContainer.skillsConsole.cloneSkill';
                        void vscode.commands.executeCommand(
                            executeCommand,
                            skillInfo
                        );
                    })
                    .then(undefined, async (error) => {
                        if (error.statusCode === 404) {
                            const skillName = getSkillNameFromLocales(skillInfo.data.skillSummary.nameByLocale!);
                            const errorMessage = `The skill '${skillName}' was not found. Please check if the skill exists in [the Alexa developer console](https://developer.amazon.com/alexa/console/ask). Clicking OK refreshes the skill list.`;
                            const refreshSelection = await vscode.window.showWarningMessage(errorMessage, ...["OK", "Cancel"]);
                            if (refreshSelection === "OK") {
                                allSkillsQP.show();
                                this.setLastUpdateTimeAndRefreshList(context.extensionContext, new Date().getTime(), allSkillsQP);
                            } else {
                                allSkillsQP.hide();
                            }
                        } else {
                            throw logAskError(error, undefined, true);
                        }
                    })
            }
        });

        const refreshButton: vscode.QuickInputButton = {
            iconPath: {
                dark: vscode.Uri.file(path.join(getImagesFolder(context.extensionContext), 'dark', 'refresh.svg')),
                light: vscode.Uri.file(path.join(getImagesFolder(context.extensionContext), 'light', 'refresh.svg')),
            },
            tooltip: 'Refresh skills',
        };
        allSkillsQP.buttons = [refreshButton];
        allSkillsQP.onDidTriggerButton(async e => {
            if (e.tooltip === 'Refresh skills') {
                clearCachedSkills(context.extensionContext);
                await this.setQpItems(context.extensionContext, allSkillsQP);
            }
        });
        allSkillsQP.show();
        await this.checkAndSetQpItems(context.extensionContext, allSkillsQP);
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        await this.skillsQuickPick(context);
    }
}
