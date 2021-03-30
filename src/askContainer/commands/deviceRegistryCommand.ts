/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import { DeviceRegistryWebview } from '../webViews/deviceRegistryWebview';
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';
import { AbstractCommand, CommandContext } from '../../runtime';

export class DeviceRegistryCommand extends AbstractCommand<void> {
    private deviceRegistryWebview: DeviceRegistryWebview;

    constructor(webview: DeviceRegistryWebview) {
        super('askContainer.skillsConsole.deviceRegistry');
        this.deviceRegistryWebview = webview;
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        try {
            this.deviceRegistryWebview.showView();
        } catch (err) {
            throw loggableAskError(`Cannot open device registry webview`, err, true);
        }
    }
}