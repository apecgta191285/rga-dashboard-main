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
exports.ScenarioLoader = exports.ScenarioError = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const tsyringe_1 = require("tsyringe");
const scenario_validator_1 = require("./scenario-validator");
const MAX_FILE_SIZE = 64 * 1024;
const ALLOWED_EXTENSIONS = ['.yaml', '.yml', '.json'];
const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
class ScenarioError extends Error {
    constructor(code, exitCode, message) {
        super(message);
        this.code = code;
        this.exitCode = exitCode;
        this.name = 'ScenarioError';
    }
}
exports.ScenarioError = ScenarioError;
let ScenarioLoader = class ScenarioLoader {
    constructor() {
        const candidateDirs = [
            path.join(__dirname, 'definitions'),
            path.join(__dirname),
            path.join(process.cwd(), 'src', 'toolkit', 'scenarios'),
        ];
        this.baseDir = candidateDirs.find(dir => fs.existsSync(dir)) ?? path.join(__dirname);
    }
    setBaseDir(dir) {
        this.baseDir = dir;
    }
    async load(nameOrId) {
        if (!NAME_REGEX.test(nameOrId)) {
            if (nameOrId.includes('/') || nameOrId.includes('\\')) {
                throw new ScenarioError('PATH_TRAVERSAL', 78, `Security violation: Path traversal detected in scenario name "${nameOrId}"`);
            }
            throw new ScenarioError('INVALID_SCENARIO_ID', 2, `Invalid scenario name format "${nameOrId}". Must match ${NAME_REGEX}`);
        }
        let filePath = this.findFile(nameOrId);
        if (!filePath) {
            const allFiles = this.listScenarioFiles();
            for (const f of allFiles) {
                try {
                    const candidate = this.loadFromFile(f.path, f.name);
                    if (candidate.aliases?.includes(nameOrId)) {
                        console.warn(`[WARN] Scenario alias "${nameOrId}" resolved to "${candidate.scenarioId}".`);
                        return candidate;
                    }
                }
                catch (e) {
                }
            }
        }
        if (!filePath) {
            throw new ScenarioError('SCENARIO_NOT_FOUND', 2, `Scenario "${nameOrId}" not found (checked .yaml, .yml, .json and aliases)`);
        }
        return this.loadFromFile(filePath, nameOrId);
    }
    async listAvailableScenarios() {
        const files = this.listScenarioFiles();
        const options = [];
        for (const file of files) {
            try {
                const scenario = this.loadFromFile(file.path, file.name);
                options.push({
                    scenarioId: scenario.scenarioId,
                    name: scenario.name,
                    aliases: scenario.aliases ?? [],
                });
            }
            catch {
            }
        }
        return options.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId));
    }
    findFile(name) {
        for (const ext of ALLOWED_EXTENSIONS) {
            const candidate = path.resolve(this.baseDir, name + ext);
            if (fs.existsSync(candidate) && this.isSafePath(candidate)) {
                return candidate;
            }
        }
        return null;
    }
    listScenarioFiles() {
        if (!fs.existsSync(this.baseDir))
            return [];
        return fs.readdirSync(this.baseDir)
            .filter(f => ALLOWED_EXTENSIONS.some(ext => f.endsWith(ext)))
            .map(f => {
            const name = path.basename(f, path.extname(f));
            return { name, path: path.join(this.baseDir, f) };
        });
    }
    isSafePath(candidate) {
        const rel = path.relative(this.baseDir, candidate);
        return !rel.startsWith('..') && !path.isAbsolute(rel);
    }
    loadFromFile(filePath, requestedId) {
        if (!this.isSafePath(filePath)) {
            throw new ScenarioError('PATH_TRAVERSAL', 78, 'Resolved path outside base directory');
        }
        const stats = fs.statSync(filePath);
        if (stats.size > MAX_FILE_SIZE) {
            throw new ScenarioError('FILE_TOO_LARGE', 78, `Scenario file exceeds size limit (${MAX_FILE_SIZE} bytes)`);
        }
        const ext = path.extname(filePath).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new ScenarioError('DISALLOWED_EXTENSION', 78, `Extension ${ext} not allowed`);
        }
        const rawContent = fs.readFileSync(filePath, 'utf8');
        const contentForCheck = rawContent.replace(/^---\s*\r?\n/, '');
        if (/\r?\n---\s*(\r?\n|$)/.test(contentForCheck)) {
            throw new ScenarioError('MULTI_DOCUMENT_NOT_ALLOWED', 2, 'Multi-document YAML is not allowed');
        }
        let parsed;
        try {
            if (ext === '.json') {
                parsed = JSON.parse(rawContent);
            }
            else {
                parsed = yaml.load(rawContent, { schema: yaml.DEFAULT_SCHEMA });
            }
        }
        catch (e) {
            throw new ScenarioError('PARSE_ERROR', 2, `Parse error: ${e.message}`);
        }
        if (!parsed || typeof parsed !== 'object') {
            throw new ScenarioError('PARSE_ERROR', 2, 'File structure is invalid (not an object)');
        }
        const scenarioId = path.basename(filePath, ext);
        const validation = (0, scenario_validator_1.validateScenarioSpec)(parsed, scenarioId);
        if (!validation.valid) {
            const msgs = validation.errors.map(err => `${err.code}: ${err.message}`).join('; ');
            throw new ScenarioError(validation.errors[0].code, 2, `Validation failed: ${msgs}`);
        }
        return {
            ...parsed,
            scenarioId
        };
    }
};
exports.ScenarioLoader = ScenarioLoader;
exports.ScenarioLoader = ScenarioLoader = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], ScenarioLoader);
//# sourceMappingURL=scenario-loader.js.map