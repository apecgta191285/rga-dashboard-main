"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixtureScheduleProvider = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tsyringe_1 = require("tsyringe");
const core_1 = require("../core");
const scheduled_execution_model_1 = require("./scheduled-execution.model");
let FixtureScheduleProvider = class FixtureScheduleProvider {
    constructor(logger, config) {
        this.cache = new Map();
        this.logger = logger.child({ source: 'FixtureScheduleProvider' });
        this.fixturesDir = config?.fixturesDir ?? this.resolveFixturesDir();
    }
    async getSchedulesForTenant(tenantId) {
        const allSchedules = await this.loadAllSchedules(tenantId);
        return allSchedules.filter((s) => s.tenantId === tenantId && s.enabled);
    }
    clearCache() {
        this.cache.clear();
        this.logger.debug('Cleared fixture cache');
    }
    async loadAllSchedules(tenantId) {
        const cached = this.cache.get(tenantId);
        if (cached) {
            return cached.schedules;
        }
        const fixturePath = path.join(this.fixturesDir, `${tenantId}.json`);
        const fixture = await this.loadFixtureFile(fixturePath);
        const errors = [];
        for (let i = 0; i < fixture.schedules.length; i++) {
            const validation = (0, scheduled_execution_model_1.validateScheduledExecution)(fixture.schedules[i]);
            if (!validation.valid) {
                errors.push(`[${i}] ${validation.errors.join(', ')}`);
            }
        }
        if (errors.length > 0) {
            throw new Error(`Invalid schedules in fixture ${fixturePath}:\n${errors.join('\n')}`);
        }
        this.cache.set(tenantId, fixture);
        this.logger.debug(`Loaded ${fixture.schedules.length} schedules from ${fixturePath}`);
        return fixture.schedules;
    }
    async loadFixtureFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            if (!parsed.version) {
                throw new Error(`Missing "version" field in fixture: ${filePath}`);
            }
            if (!Array.isArray(parsed.schedules)) {
                throw new Error(`Missing or invalid "schedules" array in fixture: ${filePath}`);
            }
            return parsed;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.warn(`Fixture file not found: ${filePath}`);
                return { version: '1.0', schedules: [] };
            }
            throw new Error(`Failed to load fixture ${filePath}: ${error.message}`);
        }
    }
    resolveFixturesDir() {
        const currentFile = __filename;
        const possiblePaths = [
            path.join(path.dirname(currentFile), '..', 'fixtures', 'schedules'),
            path.join(path.dirname(currentFile), '..', '..', '..', 'src', 'toolkit', 'fixtures', 'schedules'),
        ];
        for (const dir of possiblePaths) {
            if (fs.existsSync(dir)) {
                return dir;
            }
        }
        return possiblePaths[0];
    }
};
exports.FixtureScheduleProvider = FixtureScheduleProvider;
exports.FixtureScheduleProvider = FixtureScheduleProvider = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(core_1.TOKENS.Logger)),
    __metadata("design:paramtypes", [Object, Object])
], FixtureScheduleProvider);
//# sourceMappingURL=fixture-schedule.provider.js.map