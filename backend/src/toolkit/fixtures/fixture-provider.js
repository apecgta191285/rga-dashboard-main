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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixtureProvider = exports.FixtureError = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("node:crypto"));
const tsyringe_1 = require("tsyringe");
const MAX_FIXTURE_SIZE = 256 * 1024;
const MAX_ROWS = 1000;
class FixtureError extends Error {
    constructor(code, exitCode, message) {
        super(message);
        this.code = code;
        this.exitCode = exitCode;
        this.name = 'FixtureError';
    }
}
exports.FixtureError = FixtureError;
let FixtureProvider = class FixtureProvider {
    constructor(options) {
        this.baseDir = options?.baseDir ?? path.join(__dirname, 'golden');
    }
    async loadFixture(scenarioId, seed) {
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const filePath = path.resolve(this.baseDir, filename);
        const rel = path.relative(this.baseDir, filePath);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
            throw new FixtureError('PATH_TRAVERSAL', 78, 'Fixture path traversal violation');
        }
        if (!fs.existsSync(filePath)) {
            throw new FixtureError('FIXTURE_NOT_FOUND', 2, `Fixture file not found: ${filename}`);
        }
        const stats = fs.statSync(filePath);
        if (stats.size > MAX_FIXTURE_SIZE) {
            throw new FixtureError('FIXTURE_TOO_LARGE', 78, `Fixture exceeds size limit (${MAX_FIXTURE_SIZE} bytes)`);
        }
        let raw;
        try {
            raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        catch (e) {
            throw new FixtureError('PARSE_ERROR', 2, `Invalid JSON in fixture: ${e.message}`);
        }
        if (raw.schemaVersion !== '1.0.0') {
            throw new FixtureError('UNSUPPORTED_SCHEMA_VERSION', 2, `Unsupported fixture schemaVersion "${raw.schemaVersion}"`);
        }
        if (raw.scenarioId !== scenarioId) {
            throw new FixtureError('INVALID_SCENARIO_ID', 2, `Fixture scenarioId "${raw.scenarioId}" matches request "${scenarioId}" mismatch`);
        }
        if (raw.shape?.totalMetricRows > MAX_ROWS) {
            throw new FixtureError('FIXTURE_ROW_LIMIT', 2, `Fixture has too many rows (${raw.shape.totalMetricRows} > ${MAX_ROWS})`);
        }
        const computed = this.computeChecksum(raw.shape);
        if (computed !== raw.checksum) {
            throw new FixtureError('CHECKSUM_MISMATCH', 2, `Fixture integrity check failed. Stored: ${raw.checksum}, Computed: ${computed}`);
        }
        return raw;
    }
    computeChecksum(shape) {
        const canonical = JSON.stringify(this.deepSortKeys(shape));
        const hash = crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
        return `sha256:${hash}`;
    }
    deepSortKeys(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(v => this.deepSortKeys(v));
        }
        const sorted = {};
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
            sorted[key] = this.deepSortKeys(obj[key]);
        }
        return sorted;
    }
};
exports.FixtureProvider = FixtureProvider;
exports.FixtureProvider = FixtureProvider = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [Object])
], FixtureProvider);
//# sourceMappingURL=fixture-provider.js.map