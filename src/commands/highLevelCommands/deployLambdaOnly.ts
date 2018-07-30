'use strict';

import { EXTENSION_CONFIG, OPERATION } from "../../utils/configuration";
import { composeDeployCommand } from './deployCommandBuilder';

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.DPELOY_LAMBDA_ONLY.EXTENSION_REGISTERED_NAME;

export const deployLambdaOnly = composeDeployCommand(COMMAND_NAME, 'lambda');
