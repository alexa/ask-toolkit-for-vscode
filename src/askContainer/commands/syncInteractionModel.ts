import { AbstractCommand, CommandContext, AbstractWebView } from '../../runtime';
import * as vscode from 'vscode';

import { InteractionModelSyncWebview } from '../webViews/interactionModelSync';
import { checkProfileSkillAccess } from '../../utils/skillHelper';
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';

export class SyncInteractionModelCommand extends AbstractCommand<void> {

    private syncInteractionModelView: InteractionModelSyncWebview;

    constructor(syncInteractionModelView: InteractionModelSyncWebview) {
        super('ask.container.syncInteractionModel');
        this.syncInteractionModelView = syncInteractionModelView;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(context: CommandContext, skillFolderWs: vscode.Uri): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        try {
            checkProfileSkillAccess(context.extensionContext);
            this.syncInteractionModelView.showView(skillFolderWs);
        } catch (err) {
            throw loggableAskError(`View failed to load; try again.`, err, true);
        }
    }
}