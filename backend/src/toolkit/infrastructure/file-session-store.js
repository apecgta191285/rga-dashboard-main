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
exports.FileSessionStore = void 0;
const tsyringe_1 = require("tsyringe");
const path_1 = require("path");
const os_1 = require("os");
const contracts_1 = require("../core/contracts");
const file_system_1 = require("../core/file-system");
let FileSessionStore = class FileSessionStore {
    constructor(fs) {
        this.initialized = false;
        this.fs = fs || new file_system_1.NodeFileSystem();
        const storeDir = (0, path_1.join)((0, os_1.homedir)(), '.rga-toolkit');
        this.filePath = (0, path_1.join)(storeDir, 'session.json');
        this.data = {
            version: 1,
            lastTenantId: null,
            cache: {},
            history: [],
        };
    }
    async ensureInitialized() {
        if (this.initialized)
            return;
        try {
            const dir = (0, path_1.dirname)(this.filePath);
            if (!this.fs.exists(dir)) {
                await this.fs.mkdir(dir);
            }
            if (this.fs.exists(this.filePath)) {
                const content = await this.fs.readFile(this.filePath);
                this.data = JSON.parse(content);
            }
        }
        catch (error) {
            console.warn('Failed to load session store, starting fresh:', error);
        }
        this.initialized = true;
    }
    async save() {
        const tempPath = `${this.filePath}.tmp`;
        await this.fs.writeFile(tempPath, JSON.stringify(this.data, null, 2));
        try {
            await this.fs.rename(tempPath, this.filePath);
        }
        catch (error) {
            await this.fs.rm(this.filePath);
            await this.fs.rename(tempPath, this.filePath);
        }
        finally {
            if (this.fs.exists(tempPath)) {
                await this.fs.rm(tempPath);
            }
        }
    }
    async getLastTenantId() {
        await this.ensureInitialized();
        return this.data.lastTenantId ? (0, contracts_1.createTenantId)(this.data.lastTenantId) : null;
    }
    async setLastTenantId(tenantId) {
        await this.ensureInitialized();
        this.data.lastTenantId = tenantId;
        await this.save();
    }
    async getCache(key) {
        await this.ensureInitialized();
        const entry = this.data.cache[key];
        if (!entry)
            return null;
        if (new Date(entry.expiresAt) < new Date()) {
            delete this.data.cache[key];
            await this.save();
            return null;
        }
        return entry.value;
    }
    async setCache(key, value, ttlSeconds) {
        await this.ensureInitialized();
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
        this.data.cache[key] = { value, expiresAt };
        await this.save();
    }
    async addToHistory(entry) {
        await this.ensureInitialized();
        this.data.history.unshift(entry);
        if (this.data.history.length > 100) {
            this.data.history = this.data.history.slice(0, 100);
        }
        await this.save();
    }
    async getHistory(limit) {
        await this.ensureInitialized();
        return this.data.history.slice(0, limit);
    }
};
exports.FileSessionStore = FileSessionStore;
exports.FileSessionStore = FileSessionStore = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [Object])
], FileSessionStore);
//# sourceMappingURL=file-session-store.js.map