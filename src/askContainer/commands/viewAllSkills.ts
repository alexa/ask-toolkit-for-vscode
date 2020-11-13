import * as vscode from 'vscode';
import * as path from 'path';
import { AbstractCommand, CommandContext, SmapiResource, SmapiClientFactory, Utils } from '../../runtime';

import { SkillInfo } from '../../models/types';
import { 
    getSkillNameFromLocales, getCachedSkills, 
    setCachedSkills, clearCachedSkills, getHostedSkillMetadata
} from '../../utils/skillHelper';
import { getImagesFolder } from '../../utils/mediaHelper';

import * as model from 'ask-smapi-model';
import skillSummary = model.v1.skill.SkillSummary;
import hostedSkillMetadata = model.v1.skill.AlexaHosted.HostedSkillMetadata;
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';

const HOSTED_SKILL_RETRIEVAL = 'Getting list of Alexa-Hosted skills...';
const HOSTED_SKILL_NOT_FOUND = 'No Alexa-Hosted skills under profile. Please create one first.';
const HOSTED_SKILL_RETRIEVAL_FAILED = 'Alexa-Hosted skills retrieval failed';

export class ViewAllSkillsCommand extends AbstractCommand<void> {
    private skillInfoMap: Map<string, SmapiResource<SkillInfo>>;
    private skillsList: Array<SmapiResource<SkillInfo>> = new Array<SmapiResource<SkillInfo>>();

    constructor() {
        super('ask.container.viewAllSkills');
        // eslint-disable-next-line no-undef
        this.skillInfoMap = new Map<string, SmapiResource<SkillInfo>>();
    }

    private timeout(ms: number): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.timeout, args: `, ms);

        // eslint-disable-next-line no-undef
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async setHostedSkillInfo(): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.setHostedSkillInfo`);
        await this.setSkillsList();
        
        // eslint-disable-next-line no-undef
        await Promise.all(this.skillsList.map(async (skill, index) => {
            let skillMetadata: hostedSkillMetadata | undefined;
            // Adding the timeout to not throttle the API
            await this.timeout(500*index);
            skillMetadata = await getHostedSkillMetadata(skill.data.skillSummary.skillId ?? '', this.context);
            if (skillMetadata) {
                skill.data.isHosted = true;
            } else {
                skill.data.isHosted = false;
            }
            skill.data.hostedSkillMetadata = skillMetadata;
    }));
    }

    private async setSkillsList(): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.setSkillsList`);
        let skillsArray: Array<SmapiResource<skillSummary>> | undefined = await vscode.commands.executeCommand(
            'ask.container.listSkills',);
        
        if (skillsArray) {
            this.skillsList = [];
            skillsArray = skillsArray?.sort((skill1, skill2) => {
                if (!skill1.data || !skill2.data) {
                    return 0;
                } else {

                    const skill1Date = new Date(skill1.data.lastUpdated!);
                    const skill2Date = new Date(skill2.data.lastUpdated!);

                    if (skill1Date > skill2Date) {
                        return -1;
                    } else if(skill1Date < skill2Date) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            });

            skillsArray.forEach(skill => {
                this.skillsList.push(
                    new SmapiResource<SkillInfo>(
                        new SkillInfo(skill.data, undefined), 
                        skill.data.skillId ?? ''));
            });
        }
    }

    private async setQpItems(
        context: vscode.ExtensionContext, qp: vscode.QuickPick<vscode.QuickPickItem>): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.setQPItems`);
        qp.items = [];
        qp.busy = true;
        qp.enabled = false;
        qp.placeholder = HOSTED_SKILL_RETRIEVAL;
        
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
                    if (skill.data.isHosted) {
                        this.skillInfoMap.set(
                            getSkillNameFromLocales(skill.data.skillSummary.nameByLocale!), 
                            skill);
                    }
                });
            }
    
            const qpItems: Array<vscode.QuickPickItem> = new Array<vscode.QuickPickItem>();
            this.skillInfoMap.forEach((value: SmapiResource<SkillInfo>, key: string) => {
                qpItems.push({
                    label: key,
                    description: value.data.skillSummary.skillId
                });
            });
            qp.items = qpItems;
            qp.busy = false;
            if (qpItems.length > 0) {
                qp.placeholder = '';
            } else {
                qp.placeholder = HOSTED_SKILL_NOT_FOUND;
            }
            qp.enabled = true;
        } catch (err) {
            qp.items = [];
            qp.busy = false;
            qp.placeholder = HOSTED_SKILL_RETRIEVAL_FAILED;
            qp.enabled = true;
            throw loggableAskError(`${HOSTED_SKILL_RETRIEVAL_FAILED}`, err, true);
        } 
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        
        // Since sometimes quickpick is selecting the first item by default
        // creating quick pick and adding items manually
        const allSkillsQP = vscode.window.createQuickPick();
        allSkillsQP.title = 'Alexa-Hosted skills';
        allSkillsQP.canSelectMany = false;
        allSkillsQP.matchOnDescription = true;

        // Took from https://github.com/microsoft/vscode/issues/45466#issuecomment-421006659
        allSkillsQP.onDidChangeValue(() => {
            allSkillsQP.activeItems = [];
        });

        allSkillsQP.onDidAccept(() => {
            if (allSkillsQP.activeItems.length !== 0) {
                allSkillsQP.ignoreFocusOut = false;
                vscode.commands.executeCommand(
                    'askContainer.skillsConsole.cloneSkill', this.skillInfoMap.get(allSkillsQP.activeItems[0].label));
            }
        });

        const refreshButton: vscode.QuickInputButton = {
            iconPath: {
                dark: vscode.Uri.file(path.join(getImagesFolder(context.extensionContext), 'dark', 'refresh.svg')),
                light: vscode.Uri.file(path.join(getImagesFolder(context.extensionContext), 'light', 'refresh.svg'))
            }, 
            tooltip: 'Refresh skills'
        };
        allSkillsQP.buttons = [refreshButton];
        allSkillsQP.onDidTriggerButton(async (e) => {
            clearCachedSkills(context.extensionContext);
            this.skillInfoMap.clear();
            await this.setQpItems(context.extensionContext, allSkillsQP);
        });

        allSkillsQP.show();

        await this.setQpItems(context.extensionContext, allSkillsQP);
    }
}