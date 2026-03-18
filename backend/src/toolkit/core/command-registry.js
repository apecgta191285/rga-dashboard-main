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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
const tsyringe_1 = require("tsyringe");
const contracts_1 = require("./contracts");
const container_1 = require("./container");
let CommandRegistry = class CommandRegistry {
    constructor(logger) {
        this.logger = logger;
        this.handlers = new Map();
    }
    register(handler) {
        const metadata = handler.getMetadata();
        const name = metadata.name;
        if (this.handlers.has(name)) {
            throw new DuplicateCommandError(`Command "${name}" is already registered. ` +
                `Each command must have a unique name.`);
        }
        this.handlers.set(name, handler);
        this.logger.debug(`Registered command: ${name}`, {
            command: name,
            category: metadata.category,
        });
    }
    resolve(commandName) {
        return this.handlers.get(commandName) ?? null;
    }
    has(commandName) {
        return this.handlers.has(commandName);
    }
    listAll() {
        return Array.from(this.handlers.entries()).map(([name, handler]) => ({
            command: {
                name: name,
                description: handler.getMetadata().description,
                requiresConfirmation: this.isDestructive(handler),
            },
            handler,
        }));
    }
    isDestructive(handler) {
        const metadata = handler.getMetadata();
        return metadata.risks.some(r => r.toLowerCase().includes('delete') ||
            r.toLowerCase().includes('remove') ||
            r.toLowerCase().includes('clear'));
    }
};
exports.CommandRegistry = CommandRegistry;
exports.CommandRegistry = CommandRegistry = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __metadata("design:paramtypes", [Object])
], CommandRegistry);
class DuplicateCommandError extends contracts_1.ToolkitError {
    constructor(message) {
        super(message);
        this.code = 'DUPLICATE_COMMAND';
        this.isRecoverable = false;
    }
}
//# sourceMappingURL=command-registry.js.map