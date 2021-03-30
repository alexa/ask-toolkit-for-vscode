/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Logger } from '../../logger';
import { AbstractCommand, CommandContext } from '../../runtime';
import { onDeviceDeletionEventEmitter } from '../events';
import { getRegisteredDeviceId, deleteRegisteredDevice } from '../../utils/avs/deviceTokenUtil';
import { ERRORS } from '../../constants';

export class DeviceDeletionCommand extends AbstractCommand<void> {

    constructor() {
        super('askContainer.skillsConsole.deviceDeletion');
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        const registeredDeviceId = await getRegisteredDeviceId(context.extensionContext);
        if (registeredDeviceId && registeredDeviceId !== null) {
            const deleteConfirm = 'Yes';
            const deleteReject = 'No';
            const option = await vscode.window.showWarningMessage(
                ERRORS.DEVICE_DELETION_WARNING(registeredDeviceId), deleteConfirm, deleteReject);
            if (option === deleteConfirm) {
                Logger.verbose('Confirmed device deletion')
                await deleteRegisteredDevice(registeredDeviceId, context.extensionContext);
                onDeviceDeletionEventEmitter.fire(registeredDeviceId);
            } else {
                Logger.verbose('Device deletion cancelled')
            }
        } else {
            void vscode.window.showInformationMessage(ERRORS.NO_DEVICES_REGISTERED);
        }
    }
}