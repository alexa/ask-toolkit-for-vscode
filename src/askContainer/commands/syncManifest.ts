import { AbstractCommand, CommandContext, AbstractWebView } from '../../runtime';
import * as vscode from 'vscode';

import { ManifestSyncWebview } from '../webViews/manifestSync';
import { checkProfileSkillAccess } from '../../utils/skillHelper';
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';

export class SyncManifestCommand extends AbstractCommand<void> {

    private syncManifestView: ManifestSyncWebview;

    constructor(syncManifestView: ManifestSyncWebview) {
        super('ask.container.syncManifest');
        this.syncManifestView = syncManifestView;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(context: CommandContext, skillFolderWs: vscode.Uri): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        try {
            checkProfileSkillAccess(context.extensionContext);
            this.syncManifestView.showView(skillFolderWs);
        } catch (err) {
            throw loggableAskError(`Cannot open sync manifest view`, err, true);
        }
    }
}