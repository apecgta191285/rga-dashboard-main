import 'reflect-metadata';
import { IToolkitConfiguration } from './contracts';
export declare const TOKENS: {
    readonly Logger: symbol;
    readonly Config: symbol;
    readonly CommandRegistry: symbol;
    readonly SessionStore: symbol;
    readonly PrismaClient: symbol;
    readonly VerificationService: symbol;
    readonly ReportWriter: symbol;
};
export declare class ServiceLocator {
    static resolve<T>(token: symbol): T;
    static register<T>(token: symbol, implementation: new (...args: unknown[]) => T): void;
    static registerInstance<T>(token: symbol, instance: T): void;
}
export declare function initializeContainer(config: IToolkitConfiguration): void;
export declare function disposeContainer(): Promise<void>;
