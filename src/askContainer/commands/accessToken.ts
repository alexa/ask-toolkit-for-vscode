import { AbstractCommand, CommandContext, Utils, Resource } from '../../runtime';

export class AccessTokenCommand extends AbstractCommand<string> {
    async execute(context: CommandContext): Promise<string> {
        const profile = Utils.getCachedProfile(context.extensionContext);
        if (profile === undefined) {
            throw new Error('Profile not defined.');
        }
        const access_token = await Utils.refreshToken(profile);
        if (access_token === undefined) {
            throw new Error('Access token unavailable.');
        }
        return access_token;
    }
    constructor() {
        super('ask.accessToken');
    }
}