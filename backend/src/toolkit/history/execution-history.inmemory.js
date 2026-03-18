"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryExecutionHistoryRepository = void 0;
const tsyringe_1 = require("tsyringe");
const execution_history_model_1 = require("./execution-history.model");
const execution_history_repository_1 = require("./execution-history.repository");
const DEFAULT_CONFIG = {
    maxRecordsPerTenant: 10000,
    maxRecordAgeMs: 7 * 24 * 60 * 60 * 1000,
};
let InMemoryExecutionHistoryRepository = class InMemoryExecutionHistoryRepository {
    constructor(config = DEFAULT_CONFIG) {
        this.config = config;
        this.storage = new Map();
    }
    async record(record, now) {
        try {
            const tenantRecords = this.getTenantRecords(record.tenantId);
            tenantRecords.push(record);
            this.evictIfNecessary(record.tenantId, now);
        }
        catch (error) {
            throw new execution_history_repository_1.HistoryPersistenceError(`Failed to record execution history: ${error.message}`, record.executionId, error);
        }
    }
    async findRecentByTenant(tenantId, options) {
        const opts = (0, execution_history_model_1.createQueryOptions)(options);
        if (opts.limit && opts.limit > 1000) {
            throw new execution_history_repository_1.HistoryQueryError('Limit cannot exceed 1000', { limit: opts.limit });
        }
        let records = this.getTenantRecords(tenantId);
        records = this.applyFilters(records, opts);
        records = this.applySorting(records, opts);
        const totalCount = records.length;
        const offset = opts.offset ?? 0;
        const limit = opts.limit ?? 100;
        const paginatedRecords = records.slice(offset, offset + limit);
        return {
            records: paginatedRecords,
            totalCount,
            hasMore: totalCount > offset + limit,
        };
    }
    async countExecutionsInWindow(tenantId, windowMs, now) {
        const records = this.getTenantRecords(tenantId);
        const currentTime = now ?? new Date();
        const cutoff = new Date(currentTime.getTime() - windowMs);
        return records.filter((r) => r.finishedAt >= cutoff).length;
    }
    async getMostRecent(tenantId) {
        const records = this.getTenantRecords(tenantId);
        if (records.length === 0) {
            return null;
        }
        return records[records.length - 1] ?? null;
    }
    async getExecutionSummary(tenantId, windowMs, now) {
        const records = this.getTenantRecords(tenantId);
        const currentTime = now ?? new Date();
        const cutoff = new Date(currentTime.getTime() - windowMs);
        const windowRecords = records.filter((r) => r.finishedAt >= cutoff);
        return (0, execution_history_model_1.calculateExecutionSummary)(windowRecords, cutoff, currentTime);
    }
    getTotalRecordCount() {
        let count = 0;
        for (const records of this.storage.values()) {
            count += records.length;
        }
        return count;
    }
    getTenantRecordCount(tenantId) {
        return this.getTenantRecords(tenantId).length;
    }
    clearAll() {
        this.storage.clear();
    }
    clearTenant(tenantId) {
        this.storage.delete(tenantId);
    }
    getTenantRecords(tenantId) {
        if (!this.storage.has(tenantId)) {
            this.storage.set(tenantId, []);
        }
        return this.storage.get(tenantId);
    }
    applyFilters(records, options) {
        return records.filter((record) => {
            if (options.startTime && record.finishedAt < options.startTime) {
                return false;
            }
            if (options.endTime && record.finishedAt > options.endTime) {
                return false;
            }
            if (options.status && record.status !== options.status) {
                return false;
            }
            if (options.dryRun !== undefined && record.dryRun !== options.dryRun) {
                return false;
            }
            return true;
        });
    }
    applySorting(records, options) {
        const sorted = [...records];
        const order = options.order ?? 'desc';
        sorted.sort((a, b) => {
            const comparison = a.finishedAt.getTime() - b.finishedAt.getTime();
            return order === 'asc' ? comparison : -comparison;
        });
        return sorted;
    }
    evictIfNecessary(tenantId, now) {
        const records = this.getTenantRecords(tenantId);
        const currentTime = now ?? new Date();
        const nowMs = currentTime.getTime();
        const maxAge = this.config.maxRecordAgeMs;
        const ageCutoff = new Date(nowMs - maxAge);
        let evictionIndex = 0;
        while (evictionIndex < records.length &&
            records[evictionIndex].finishedAt < ageCutoff) {
            evictionIndex++;
        }
        if (evictionIndex > 0) {
            records.splice(0, evictionIndex);
        }
        const maxCount = this.config.maxRecordsPerTenant;
        if (records.length > maxCount) {
            const toRemove = records.length - maxCount;
            records.splice(0, toRemove);
        }
    }
};
exports.InMemoryExecutionHistoryRepository = InMemoryExecutionHistoryRepository;
exports.InMemoryExecutionHistoryRepository = InMemoryExecutionHistoryRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [Object])
], InMemoryExecutionHistoryRepository);
//# sourceMappingURL=execution-history.inmemory.js.map