"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESET_TENANT_HARD_COMMAND = exports.RESET_TENANT_COMMAND = void 0;
exports.createResetTenantCommand = createResetTenantCommand;
exports.createResetTenantHardCommand = createResetTenantHardCommand;
exports.RESET_TENANT_COMMAND = 'reset-tenant';
exports.RESET_TENANT_HARD_COMMAND = 'reset-tenant-hard';
function createResetTenantCommand(tenantId) {
    return {
        name: exports.RESET_TENANT_COMMAND,
        description: 'Reset tenant operational data (metrics, alerts) - preserves campaigns and definitions',
        requiresConfirmation: true,
        tenantId,
        mode: 'PARTIAL',
    };
}
function createResetTenantHardCommand(tenantId, confirmation) {
    return {
        name: exports.RESET_TENANT_HARD_COMMAND,
        description: 'HARD RESET: Delete ALL tenant data including campaigns and alert definitions',
        requiresConfirmation: true,
        tenantId,
        mode: 'HARD',
        confirmation,
    };
}
//# sourceMappingURL=reset-tenant.command.js.map