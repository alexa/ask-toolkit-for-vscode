import * as vscode from 'vscode';
import * as path from 'path';
import { AbstractCommand, CommandContext, SmapiResource } from '../../runtime';

import { SkillInfo } from '../../models/types';
import {
    getSkillNameFromLocales,
    getCachedSkills,
    setCachedSkills,
    clearCachedSkills,
    getHostedSkillMetadata,
} from '../../utils/skillHelper';
import { getImagesFolder } from '../../utils/mediaHelper';

import * as model from 'ask-smapi-model';
import skillSummary = model.v1.skill.SkillSummary;
import hostedSkillMetadata = model.v1.skill.AlexaHosted.HostedSkillMetadata;
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';

const AlexaHostedProvision = 'Alexa-hosted';

const ALL_SKILLS_QUICK_PICK_TITLE = 'All skills';
const SKILL_RETRIEVAL_PLACEHOLDER = 'Getting the list of skills...';
const SKILL_NOT_FOUND = 'No Alexa custom skills found under profile. Please create one first.';
const SKILL_RETRIEVAL_FAILED = 'Alexa skills retrieval failed.';

export class ViewAllSkillsCommand extends AbstractCommand<void> {
    private skillInfoMap: Map<string, SmapiResource<SkillInfo>>;
    private skillsList: Array<SmapiResource<SkillInfo>> = new Array<SmapiResource<SkillInfo>>();

    constructor() {
        super('ask.container.viewAllSkills');
        this.skillInfoMap = new Map<string, SmapiResource<SkillInfo>>();
    }

    private timeout(ms: number): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.timeout, args: `, ms);

        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async setHostedSkillInfo(): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.setHostedSkillInfo`);
        await this.setSkillsList();
        await Promise.all(
            this.skillsList.map(async (skill, index) => {
                // Adding the timeout to not throttle the API
                await this.timeout(500 * index);
                const skillMetadata: hostedSkillMetadata | undefined = await getHostedSkillMetadata(
                    skill.data.skillSummary.skillId ?? '',
                    this.context
                );
                skill.data.isHosted = skillMetadata !== undefined;
                skill.data.hostedSkillMetadata = skillMetadata;
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
            throw loggableAskError(`${SKILL_RETRIEVAL_FAILED}`, err, true);
        }
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

        allSkillsQP.onDidAccept(() => {
            if (allSkillsQP.activeItems.length !== 0) {
                allSkillsQP.ignoreFocusOut = false;
                const executeCommand = 'askContainer.skillsConsole.cloneSkill';
                void vscode.commands.executeCommand(
                    executeCommand,
                    this.skillInfoMap.get(allSkillsQP.activeItems[0].label)
                );
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
        await this.setQpItems(context.extensionContext, allSkillsQP);
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        await this.skillsQuickPick(context);
    }
}
