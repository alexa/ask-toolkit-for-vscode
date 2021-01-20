import { AbstractCommand, CommandContext, Utils } from '../../runtime';
import * as vscode from 'vscode';

import { onSkillConsoleViewChangeEventEmitter, onWorkspaceOpenEventEmitter } from '../../askContainer/events';
import { Logger } from '../../logger';
import { clearCachedSkills } from '../../utils/skillHelper';
import { disposeWebviews } from '../../utils/webViews/viewManager';
import { loggableAskError } from '../../exceptions';
import { SchemaManager } from '../../utils/schemaHelper';

const VENDOR_ID = 'Vendor ID';

export class ChangeProfileCommand extends AbstractCommand<void> {
    constructor() {
        super('ask.changeProfile');
    }

    private setQpItems(qp: vscode.QuickPick<vscode.QuickPickItem>): void {
        Logger.verbose(`Calling method: ${this.commandName}.setQpItems`);
        const profiles: string[] | null = Utils.listExistingProfileNames();

        if (profiles) {
            const qpItems: vscode.QuickPickItem[] = new Array<vscode.QuickPickItem>();
            profiles.forEach(profile => {
                try {
                    const vendorId = Utils.resolveVendorId(profile);
                    qpItems.push({
                        label: profile,
                        detail: `${VENDOR_ID} : ${vendorId}`
                    });
                } catch (err) {
                    throw loggableAskError(`Failed to retrieve vendorID for profile ${profile}`, err, true);
                }
            });
            qp.items = qpItems;
            qp.enabled = true;
        }
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);

        // Since sometimes quickPick is selecting the first item by default
        // creating quick pick and adding items manually
        const profileQp = vscode.window.createQuickPick();
        profileQp.title = 'Select profile to use';
        profileQp.canSelectMany = false;
        profileQp.matchOnDescription = true;

        // Took from https://github.com/microsoft/vscode/issues/45466#issuecomment-421006659
        profileQp.onDidChangeValue(() => {
            profileQp.activeItems = [];
        });

        profileQp.onDidAccept(() => {
            if (profileQp.activeItems.length !== 0) {
                profileQp.ignoreFocusOut = false;
                context.extensionContext.globalState.update('LwaProfile', profileQp.activeItems[0].label);
                clearCachedSkills(context.extensionContext);
                onSkillConsoleViewChangeEventEmitter.fire(undefined);
                onWorkspaceOpenEventEmitter.fire(undefined);
                // Close open web views upon profile change.
                disposeWebviews();
                profileQp.dispose();

                // update vendor specific schemas upon profile change.
                void SchemaManager.getInstance().updateSchemas();
            }
        });
        profileQp.ignoreFocusOut = true;
        this.setQpItems(profileQp);
        profileQp.show();
    }
}