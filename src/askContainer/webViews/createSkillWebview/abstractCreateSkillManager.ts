/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { ExtensionContext, Progress } from 'vscode';

import { createSkillWebViewType } from './createSkillWebview';
import { DEFAULT_PROFILE } from '../../../constants';
import { Utils } from '../../../runtime';

export abstract class AbstractCreateSkillManager {
    protected context: ExtensionContext;
    protected skillFolder: string;
    protected profile: string;

    constructor(context: ExtensionContext, skillFolder: string) {
        this.context = context;
        this.skillFolder = skillFolder;
        this.profile = Utils.getCachedProfile(this.context) ?? DEFAULT_PROFILE;
    }

    abstract createSkill(userInput: createSkillWebViewType, progress?: Progress<any>): Promise<void>;
}