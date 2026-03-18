import { ICommandRegistry, TenantId } from '../../core/contracts';
export interface CommandUi {
    readonly name: string;
    execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void>;
}
