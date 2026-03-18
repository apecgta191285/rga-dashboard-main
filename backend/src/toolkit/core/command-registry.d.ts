import { ICommandRegistry, ICommandHandler, ICommand, CommandName, ILogger } from './contracts';
export declare class CommandRegistry implements ICommandRegistry {
    private logger;
    private handlers;
    constructor(logger: ILogger);
    register(handler: ICommandHandler): void;
    resolve(commandName: CommandName): ICommandHandler | null;
    has(commandName: CommandName): boolean;
    listAll(): ReadonlyArray<{
        command: ICommand;
        handler: ICommandHandler;
    }>;
    private isDestructive;
}
