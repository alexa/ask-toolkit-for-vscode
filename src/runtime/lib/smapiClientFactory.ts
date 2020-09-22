import * as vscode from 'vscode';
import { RefreshTokenConfig, CustomSmapiClientBuilder } from "ask-smapi-sdk";
import * as smapiModel from 'ask-smapi-model';
import { CredentialsManager, Credentials } from "./credentialsManager";
import { resolver } from "./utils/configuration";
import { AUTH } from "./utils/constants";
import { EXTENSION_ID } from '../../constants';

export class SmapiClientFactory {
    private static readonly profileInstanceMap: Map<string, smapiModel.services.skillManagement.SkillManagementServiceClient> = new Map();

    private constructor() { }

    public static getInstance(profile: string, context: vscode.ExtensionContext): smapiModel.services.skillManagement.SkillManagementServiceClient {
        let smapiClient = this.profileInstanceMap.get(profile);
        if (!smapiClient) {
            const authConfig: Credentials = CredentialsManager.getCredentials(profile);
            const refreshTokenConfig: RefreshTokenConfig = {
                clientId: authConfig.clientId,
                clientSecret: authConfig.clientSecret,
                refreshToken: authConfig.refreshToken
            };
            const pluginVersion: string = vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON.version;
            smapiClient = new CustomSmapiClientBuilder()
                .withApiEndpoint(resolver([process.env.ASK_SMAPI_SERVER_BASE_URL, undefined]))
                .withAuthEndpoint(resolver([process.env.ASK_LWA_TOKEN_HOST, AUTH.DEFAULT_ASK_LWA_TOKEN_HOST]))
                .withRefreshTokenConfig(refreshTokenConfig)
                .withCustomUserAgent(`alexa-skills-kit-toolkit/${pluginVersion}`)
                .client();
            this.profileInstanceMap.set(profile, smapiClient);
        }
        return smapiClient;
    }
}