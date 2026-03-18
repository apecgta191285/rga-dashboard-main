"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryScheduleProvider = void 0;
const tsyringe_1 = require("tsyringe");
const scheduled_execution_model_1 = require("./scheduled-execution.model");
let InMemoryScheduleProvider = class InMemoryScheduleProvider {
    constructor() {
        this.storage = new Map();
    }
    async getSchedulesForTenant(tenantId) {
        const tenantSchedules = this.getTenantStorage(tenantId);
        return Array.from(tenantSchedules.values()).filter((s) => s.enabled);
    }
    addSchedule(tenantId, execution) {
        const validation = (0, scheduled_execution_model_1.validateScheduledExecution)(execution);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }
        if (execution.tenantId !== tenantId) {
            return {
                success: false,
                errors: [
                    `Tenant mismatch: schedule.tenantId (${execution.tenantId}) does not match provided tenantId (${tenantId})`,
                ],
            };
        }
        const tenantStorage = this.getTenantStorage(tenantId);
        tenantStorage.set(execution.id, execution);
        return { success: true };
    }
    removeSchedule(tenantId, scheduleId) {
        const tenantStorage = this.getTenantStorage(tenantId);
        return tenantStorage.delete(scheduleId);
    }
    getSchedule(tenantId, scheduleId) {
        const tenantStorage = this.getTenantStorage(tenantId);
        return tenantStorage.get(scheduleId) ?? null;
    }
    getAllSchedules(tenantId) {
        const tenantStorage = this.getTenantStorage(tenantId);
        return Array.from(tenantStorage.values());
    }
    clearTenant(tenantId) {
        this.storage.delete(tenantId);
    }
    clearAll() {
        this.storage.clear();
    }
    hasSchedule(tenantId, scheduleId) {
        const tenantStorage = this.storage.get(tenantId);
        if (!tenantStorage) {
            return false;
        }
        return tenantStorage.has(scheduleId);
    }
    getScheduleCount(tenantId) {
        const tenantStorage = this.storage.get(tenantId);
        return tenantStorage?.size ?? 0;
    }
    getTenantStorage(tenantId) {
        if (!this.storage.has(tenantId)) {
            this.storage.set(tenantId, new Map());
        }
        return this.storage.get(tenantId);
    }
};
exports.InMemoryScheduleProvider = InMemoryScheduleProvider;
exports.InMemoryScheduleProvider = InMemoryScheduleProvider = __decorate([
    (0, tsyringe_1.injectable)()
], InMemoryScheduleProvider);
//# sourceMappingURL=inmemory-schedule.provider.js.map