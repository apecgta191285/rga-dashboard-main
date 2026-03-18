export declare class IntegrationErrorHandler {
    private readonly logger;
    handle<T>(operation: () => Promise<T>, fallbackValue: T, context: string): Promise<T>;
    private handleError;
    private isTokenExpired;
    private isNetworkError;
}
