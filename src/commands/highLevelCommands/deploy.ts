'use strict';

import { EXTENSION_CONFIG, OPERATION } from "../../utils/configuration";
import { composeDeployCommand } from './deployCommandBuilder';

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.DEPLOY.EXTENSION_REGISTERED_NAME;

export const deploy = composeDeployCommand(COMMAND_NAME);
