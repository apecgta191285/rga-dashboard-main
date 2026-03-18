export interface OAuthConfig {
    authUrl: string;
    tokenUrl: string;
    refreshUrl?: string;
    clientIdParam: string;
    clientSecretParam: string;
    codeParam: string;
    contentType: 'json' | 'form-urlencoded';
}
export interface OAuthAccount {
    id: string;
    name: string;
    status?: string;
    type?: string;
}
export interface OAuthCallbackResult {
    status: 'select_account' | 'success';
    accounts?: OAuthAccount[];
    tempToken?: string;
    accountId?: string;
}
export interface OAuthConnectionResult {
    success: boolean;
    accountId: string;
    accountName?: string;
}
export interface OAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    expiresAt?: Date;
}
export interface OAuthProvider {
    generateAuthUrl(userId: string, tenantId: string): string;
    handleCallback(code: string, state: string): Promise<OAuthCallbackResult>;
    getTempAccounts(tempToken: string): Promise<OAuthAccount[]>;
    completeConnection(tempToken: string, accountId: string, tenantId: string): Promise<OAuthConnectionResult>;
    refreshAccessToken(accountId: string, tenantId: string): Promise<string>;
    getConnectedAccounts(tenantId: string): Promise<any[]>;
    disconnect(tenantId: string): Promise<boolean>;
}
export interface SandboxSupport {
    isSandboxMode(): boolean;
    connectSandbox(tenantId: string): Promise<OAuthConnectionResult>;
}
