import { readToken, StoredToken } from "./utils/oauthWrapper";
import { resolveVendorId } from "./utils/profileHelper";
import { AUTH } from "./utils/constants";
import { resolver } from "./utils/configuration";
import { loggableAskError } from '../../exceptions';

export class Credentials {
    readonly clientId: string;
    readonly clientSecret: string;
    readonly refreshToken: string;
    readonly vendorId: string;

    constructor(
        clientId: string, clientSecret: string,
        refreshToken: string, vendorId: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.vendorId = vendorId;
    }
}

export class CredentialsManager {
    public static getCredentials(profile: string, clientId?: string, clientSecret?: string): Credentials {
        const token: StoredToken | undefined = readToken(profile);
        let vendorId: string;
        try {
            vendorId = resolveVendorId(profile);
        } catch (err) {
            throw loggableAskError(`Failed to retrieve vendorID for profile ${profile}`, err, true);
        }
        return new Credentials(resolver([clientId, process.env.ASK_LWA_CLIENT_ID, AUTH.DEFAULT_CLIENT_ID])
        , resolver([clientSecret, process.env.ASK_LWA_CLIENT_CONFIRMATION, AUTH.DEFAULT_CLIENT_SECRET]), 
        token!.refresh_token, vendorId);
    }
}