import { ICommand, ICommandHandler, ICommandMetadata, IExecutionContext, CommandName, Result, ILogger } from '../core/contracts';
export declare abstract class BaseCommand implements ICommand {
    abstract readonly name: CommandName;
    abstract readonly description: string;
    readonly requiresConfirmation: boolean;
    constructor(requiresConfirmation?: boolean);
}
export interface IBaseCommandHandlerDeps {
    logger: ILogger;
}
export declare abstract class BaseCommandHandler<TCommand extends ICommand, TResult> implements ICommandHandler<TCommand, TResult> {
    protected readonly logger: ILogger;
    constructor(deps: IBaseCommandHandlerDeps);
    execute(command: TCommand, context: IExecutionContext): Promise<Result<TResult>>;
    abstract canHandle(command: ICommand): command is TCommand;
    abstract getMetadata(): ICommandMetadata;
    abstract validate(command: TCommand): Result<void>;
    protected abstract executeCore(command: TCommand, context: IExecutionContext): Promise<Result<TResult>>;
}
