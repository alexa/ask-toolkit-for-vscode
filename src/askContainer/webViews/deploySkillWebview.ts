import * as vscode from 'vscode';
import { AbstractWebView } from '../../runtime';

import { ViewLoader } from '../../utils/webViews/viewLoader';
import { deploySkill } from '../../utils/deploySkillHelper';
import { getSkillDetailsFromWorkspace } from '../../utils/skillHelper';
import { getOrInstantiateGitApi } from '../../utils/gitHelper';
import { API } from '../../@types/git';
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';
import { getSkillFolderInWs } from '../../utils/workspaceHelper';
import { WEB_VIEW_NAME } from '../../constants';

export class DeploySkillWebview extends AbstractWebView {
    private loader: ViewLoader;
    private gitApi: API | undefined;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.DEPLOY_SKILL, this);
        getOrInstantiateGitApi(context)
            .then(value => {
                this.gitApi = value;
            })
            .catch(err => {
                throw loggableAskError('Failed to retrieve git api.', err);
            });
    }

    async onViewChangeListener(event: vscode.WebviewPanelOnDidChangeViewStateEvent): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);
        if (event.webviewPanel.visible) {
            await this.refresh();
        }
    }

    async onReceiveMessageListener(message: any): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args: `, message);
        if (message === 'refresh') {
            void this.refresh();
        } else if (message === 'deploySkill') {
            try {
                const skillWorkspace = getSkillFolderInWs(this.extensionContext);
                this.getPanel().webview.html = this.loader.renderView({
                    name: 'deployInProgress',
                    errorMsg: 'Skill deployment in progress...',
                });
                await deploySkill(skillWorkspace!, this.extensionContext, this);
            } catch (err) {
                throw loggableAskError(`Skill deploy failed`, err, true);
            }
        } else {
            throw loggableAskError('Unexpected message received from webview.');
        }
    }

    private async checkIfChangesExistFromUpstream(): Promise<boolean> {
        Logger.verbose(`Calling method: ${this.viewId}.checkIfChangesExistFromUpstream`);
        const skillWorkspace = getSkillFolderInWs(this.extensionContext);
        const skillRepo = this.gitApi?.getRepository(skillWorkspace!);

        const changes = await skillRepo?.diffIndexWith('@{upstream}');
        if (changes === undefined || changes.length === 0) {
            return false;
        } else {
            return true;
        }
    }

    private async refresh(): Promise<void> {
        const changesExist = await this.checkIfChangesExistFromUpstream();
        void this.getWebview().postMessage({
            changesExist,
        });
    }

    getHtmlForView(...args: any[]): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        const skillDetails = getSkillDetailsFromWorkspace(this.extensionContext);
        const skillId: string = skillDetails.skillId;
        const skillName: string = skillDetails.skillName;
        void this.checkIfChangesExistFromUpstream().then(value => {
            void this.getWebview().postMessage({
                changesExist: value,
            });
        });
        return this.loader.renderView({
            name: WEB_VIEW_NAME.DEPLOY_SKILL,
            js: true,
            args: {
                skillId,
                skillName,
            },
        });
    }
}
