import { CommandRegistry } from '../core/command-registry';
import { ICommand, ILogger, IToolkitConfiguration, IUiPrinter, Result } from '../core/contracts';
import { TenantResetService } from '../services/tenant-reset.service';
import { PrismaService } from '../../modules/prisma/prisma.service';
export declare class ToolkitCommandExecutorService {
    private readonly commandRegistry;
    private readonly config;
    private readonly logger;
    private readonly printer;
    private readonly resetService;
    private readonly prisma;
    private readonly maxConcurrentCommands;
    private inFlightCommands;
    constructor(commandRegistry: CommandRegistry, config: IToolkitConfiguration, logger: ILogger, printer: IUiPrinter, resetService: TenantResetService, prisma: PrismaService);
    issueHardResetToken(tenantId: string): {
        token: string;
        expiresAt: Date;
    };
    executeCommand<TCommand extends ICommand, TResult>(command: TCommand, params: {
        tenantId: string;
        dryRun: boolean;
    }): Promise<Result<TResult>>;
    private resolveMaxConcurrentCommands;
    private tryAcquireExecutionSlot;
    private releaseExecutionSlot;
}
