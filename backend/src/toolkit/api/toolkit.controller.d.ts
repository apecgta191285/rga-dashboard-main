import { AlertScenarioDto, GetAlertHistoryQueryDto, GetAlertsQueryDto, GetMetricsQueryDto, ResetTenantDto, ResetTenantHardDto, ResetTenantHardTokenDto } from './dto';
import { ToolkitCommandExecutorService } from './toolkit-command-executor.service';
import { ToolkitQueryService } from './toolkit-query.service';
interface ToolkitResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
export declare class ToolkitController {
    private readonly queryService;
    private readonly commandExecutor;
    constructor(queryService: ToolkitQueryService, commandExecutor: ToolkitCommandExecutorService);
    getMetrics(query: GetMetricsQueryDto): Promise<ToolkitResponse<unknown>>;
    getAlerts(query: GetAlertsQueryDto): Promise<ToolkitResponse<unknown>>;
    getAlertHistory(query: GetAlertHistoryQueryDto): Promise<ToolkitResponse<unknown>>;
    runAlertScenario(dto: AlertScenarioDto): Promise<ToolkitResponse<unknown>>;
    resetTenant(dto: ResetTenantDto): Promise<ToolkitResponse<unknown>>;
    generateResetTenantHardToken(dto: ResetTenantHardTokenDto): Promise<ToolkitResponse<{
        token: string;
        expiresAt: string;
    }>>;
    resetTenantHard(dto: ResetTenantHardDto): Promise<ToolkitResponse<unknown>>;
    private mapResultToResponse;
}
export {};
