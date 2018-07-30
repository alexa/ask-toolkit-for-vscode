'use strict';
import * as vscode from 'vscode';
import { IRequiredInputParameter, IConfigKey } from "./lowLevelCommandBuilder";
import { findProfile, findSkillId } from './commandParametersHelper';

function postProcessForFilter(item: string) {
    const keywordIndictTheFlagIsNotNeeded = new Set(['ALL', 'DEFAULT']);
    // choose 'All' means no need for this flag
    if (keywordIndictTheFlagIsNotNeeded.has(item)) {
        return false;
    } else {
        return item;
    }
}

const stage = <IRequiredInputParameter> {
    parameterName: 'stage',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Please pick the stage to perform the operation'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'development',
                description: 'Development stage of the skill'
            },
            <vscode.QuickPickItem> {
                label: 'live',
                description: 'Live stage of the skill'
            }
        ]
    },
    configKey: <IConfigKey> {
        configName: 'granularCommandDefaultStage'
    }
};

const locale = <IRequiredInputParameter> {
    parameterName: 'locale',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Please pick the locale to perform the operation'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'de-DE'
            },
            <vscode.QuickPickItem> {
                label: 'en-AU'
            },
            <vscode.QuickPickItem> {
                label: 'en-CA'
            },
            <vscode.QuickPickItem> {
                label: 'en-GB'
            },
            <vscode.QuickPickItem> {
                label: 'en-IN'
            },
            <vscode.QuickPickItem> {
                label: 'en-US'
            },
            <vscode.QuickPickItem> {
                label: 'es-ES'
            },
            <vscode.QuickPickItem> {
                label: 'fr-FR'
            },
            <vscode.QuickPickItem> {
                label: 'it-IT'
            },
            <vscode.QuickPickItem> {
                label: 'ja-JP'
            }
        ]
    }
};

const profile = <IRequiredInputParameter> {
    parameterName: 'profile',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the profile. [Hit "Enter" to continue and omit this parameter]'
    },
    configKey: <IConfigKey> {
        configName: 'profile'
    },
    isRequired: false
};

const skillId = <IRequiredInputParameter> {
    parameterName: 'skill-id',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the skill ID',
        validateInput: (input:string): string | void => {
            if (input.trim().length === 0) {
                return 'Input skill Id cannot be empty';
            }
        }
    },
    configKey: <IConfigKey> {
        configName: 'shouldUseSkillIdFoundInCurrentWorkspace',
        postProcess: (doesAutoDetect: boolean) => {
            if (!doesAutoDetect) {
                return undefined;
            }

            const profile = findProfile();
            if (!profile) {
                vscode.window.showWarningMessage('Cannot auto detect skill Id since the profile has not been define in setting.json');
                return undefined;
            } else {
                return findSkillId(profile);
            }
        }
    }
};

const file = <IRequiredInputParameter> {
    parameterName: 'file',
    queryInputMethod:'showOpenDialog',
    options: <vscode.OpenDialogOptions> {
        'canSelectMany': false,
        'openLabel': 'Upload',
        'canSelectFiles': true,
        'canSelectFolders': false,
        'defaultUri': vscode.workspace.workspaceFolders? vscode.workspace.workspaceFolders[0].uri : undefined
    },
    configKey: <IConfigKey> {
        configName: 'doesUseCurrentActiveWindowContent',
        postProcess: (doesUseCurrentActiveWindowContent: boolean) => {
            if (!doesUseCurrentActiveWindowContent) {
                return undefined;
            }

            if (!vscode.window.activeTextEditor) {
                vscode.window.showWarningMessage('Cannot find active window.');
                return undefined;
            } else {
                return vscode.window.activeTextEditor.document.uri.fsPath;
            }
        }
    }
};

const simulationInputUtterance = <IRequiredInputParameter> {
    parameterName: 'text',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the utterance.'
    }
};

const simulationId = <IRequiredInputParameter> {
    parameterName: 'simulation-id',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the simulation-id for the simulation.'
    }
};

const endpointRegion = <IRequiredInputParameter> {
    parameterName: 'endpoint-region',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the endpoint-region for the skill.'
    }
};

const validationId = <IRequiredInputParameter> {
    parameterName: 'validation-id',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the validation-id for the validation.'
    }
};

const accountId = <IRequiredInputParameter> {
    parameterName: 'account-id',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the Id for the account.'
    }
};

const eTag = <IRequiredInputParameter> {
    parameterName: 'etag',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the eTag. [Hit "Enter" to continue and omit this parameter]'
    },
    isRequired: false
};

const vendorId = <IRequiredInputParameter> {
    parameterName: 'vendor-id',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the vendor id.'
    }
};

const maxItem = <IRequiredInputParameter> {
    parameterName: 'max-items',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the the total number of items to return in the command\'s output. Input should be a positive number. [Hit "Enter" to continue and omit this parameter]'
    },
    isRequired: false
};

const nextToken = <IRequiredInputParameter> {
    parameterName: 'next-token',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the token to retrieve next page of results. [Hit "Enter" to continue and omit this parameter]'
    },
    isRequired: false
};

const intentRequestsHistorySortField = <IRequiredInputParameter> {
    parameterName: 'sort-field',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Field by which to sort results'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'DEFAULT'
            },
            <vscode.QuickPickItem> {
                label: 'dialogAct.name'
            },
            <vscode.QuickPickItem> {
                label: 'intent.confidence.bin'
            },
            <vscode.QuickPickItem> {
                label: 'stage'
            },
            <vscode.QuickPickItem> {
                label: 'intent.name'
            },
            <vscode.QuickPickItem> {
                label: 'utteranceText'
            },
            <vscode.QuickPickItem> {
                label: 'interactionType'
            },
            <vscode.QuickPickItem> {
                label: 'publicationStatus'
            }
        ],
        postProcess: postProcessForFilter
    }
};

const intentRequestsHistorySortDirection = <IRequiredInputParameter> {
    parameterName: 'sort-direction',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Order to sort results'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'desc'
            },
            <vscode.QuickPickItem> {
                label: 'asc'
            }
        ]
    }
};

const intentRequestsHistoryMaxResults = <IRequiredInputParameter> {
    parameterName: 'max-results',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the maximum number of results to display. [Hit "Enter" to continue and omit this parameter]'
    },
    isRequired: false
};

const privateDistributionAccountStage =  <IRequiredInputParameter> {
    parameterName: 'stage',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Please pick the stage to perform the operation'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'live',
                description: 'Live stage of the skill'
            }
        ]
    }
};



const ispId = <IRequiredInputParameter> {
    parameterName: 'isp-id',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the product id for the in-skill product.'
    }
};

const ispSummaryBoolean = <IRequiredInputParameter> {
    parameterName: 'summary',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Return only in-skill product summary?'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'Yes'
            },
            <vscode.QuickPickItem> {
                label: 'No'
            }
        ],
        postProcess: (item: string) => {
            if (item === 'Yes') {
                return true;
            }
            return false;
        }
    }
};

const ispIsAssociatedWithSkill = <IRequiredInputParameter> {
    parameterName: 'isAssociatedWithSkill',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Whether or not the in-skill products are associated to a skill'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'ALL'
            },
            <vscode.QuickPickItem> {
                label: 'ASSOCIATED_WITH_SKILL'
            },
            <vscode.QuickPickItem> {
                label: 'NOT_ASSOCIATED_WITH_SKILL'
            }
        ],
        postProcess: postProcessForFilter
    }
};

const ispStage = <IRequiredInputParameter> {
    parameterName: 'stage',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Stage for the in-skill product'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'ALL'
            },
            <vscode.QuickPickItem> {
                label: 'development'
            },
            <vscode.QuickPickItem> {
                label: 'live'
            }
        ],
        postProcess: postProcessForFilter
    }
};

const ispType = <IRequiredInputParameter> {
    parameterName: 'type',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Type for the in-skill product'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'ALL'
            },
            <vscode.QuickPickItem> {
                label: 'ENTITLEMENT'
            },
            <vscode.QuickPickItem> {
                label: 'SUBSCRIPTION'
            }
        ],
        postProcess: postProcessForFilter
    }
};

const ispReferenceName = <IRequiredInputParameter> {
    parameterName: 'reference-name',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the reference name for the in-skill product. [Hit "Enter" to continue and omit this parameter]'
    },
    isRequired: false
};

const ispStatus = <IRequiredInputParameter> {
    parameterName: 'status',
    queryInputMethod: 'showQuickPick',
    options: <vscode.QuickPickOptions> {
        placeHolder: 'Status for the in-skill product'
    },
    quickPick: {
        items: [
            <vscode.QuickPickItem> {
                label: 'ALL'
            },
            <vscode.QuickPickItem> {
                label: 'PUBLISHED'
            },
            <vscode.QuickPickItem> {
                label: 'SUPPRESSED'
            },
            <vscode.QuickPickItem> {
                label: 'COMPLETE'
            },
            <vscode.QuickPickItem> {
                label: 'CERTIFICATION'
            },
            <vscode.QuickPickItem> {
                label: 'INCOMPLETE'
            }
        ],
        postProcess: postProcessForFilter
    }
};

const lambdaFunction = <IRequiredInputParameter> {
    parameterName: 'function',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the Lambda function name'
    }
};

const lambdaStartTime = <IRequiredInputParameter> {
    parameterName: 'start-time',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the queried logs starting time. [Hit "Enter" to continue and use default value]'
    },
    isRequired: false
};

const lambdaEndTime = <IRequiredInputParameter> {
    parameterName: 'end-time',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the queried logs ending time. [Hit "Enter" to continue and use default value]'
    },
    isRequired: false
};

const lambdaNumberOfLogs = <IRequiredInputParameter> {
    parameterName: 'limit',
    queryInputMethod: 'showInputBox',
    options: <vscode.InputBoxOptions> {
        prompt: 'Please input the number of log entries to display. [Hit "Enter" to continue and use default value]'
    },
    isRequired: false
};

export const commandInputParameters = {
    stage: stage,
    locale: locale,
    profile: profile,
    skillId: skillId,
    file: file,
    simulationInputUtterance: simulationInputUtterance,
    simulationId: simulationId,
    endpointRegion: endpointRegion,
    validationId: validationId,
    accountId: accountId,
    eTag: eTag,
    vendorId: vendorId,
    maxItem: maxItem,
    nextToken: nextToken,
    intentRequestsHistorySortField: intentRequestsHistorySortField,
    intentRequestsHistorySortDirection: intentRequestsHistorySortDirection,
    intentRequestsHistoryMaxResults: intentRequestsHistoryMaxResults,
    privateDistributionAccountStage:privateDistributionAccountStage
};

export const ispInputParameters = {
    id: ispId,
    summaryBoolean: ispSummaryBoolean,
    isAssociatedWithSkill: ispIsAssociatedWithSkill,
    stage: ispStage,
    type: ispType,
    referenceName: ispReferenceName,
    status: ispStatus
};

export const lambdaParameters = {
    function: lambdaFunction,
    startTime: lambdaStartTime,
    endTime: lambdaEndTime,
    numberOfLogs: lambdaNumberOfLogs
};