import { Utils } from '../runtime';

export class DynamicConfig {
    static get s3Scripts() {
        const baseUrl = Utils.resolver([process.env.ASK_S3_SCRIPTS_BASE_URL, 'https://ask-tools-core-content.s3-us-west-2.amazonaws.com']);
        return {
            authInfo: `${baseUrl}/auth_info`,
            prePush: `${baseUrl}/git-hooks-templates/pre-push/pre-push`,
            askPrePush: `${baseUrl}/git-hooks-templates/pre-push/ask-pre-push`,
            gitCredentialHelper: `${baseUrl}/helpers/prod/git-credential-helper`,
        };
    }
}