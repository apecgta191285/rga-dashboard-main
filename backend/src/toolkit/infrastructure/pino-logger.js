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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinoLogger = void 0;
const pino_1 = __importDefault(require("pino"));
const tsyringe_1 = require("tsyringe");
const container_1 = require("../core/container");
let PinoLogger = class PinoLogger {
    constructor(config) {
        this.config = config;
        const transport = config.logging.format === 'pretty'
            ? pino_1.default.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
                worker: {
                    stdout: false,
                    stderr: true,
                },
            })
            : undefined;
        this.logger = (0, pino_1.default)({
            level: config.logging.level,
            base: {
                env: config.environment,
            },
        }, transport || process.stderr);
    }
    debug(message, meta) {
        this.logger.debug(meta, message);
    }
    info(message, meta) {
        this.logger.info(meta, message);
    }
    warn(message, meta) {
        this.logger.warn(meta, message);
    }
    error(message, error, meta) {
        const errorMeta = error ? {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            ...meta,
        } : meta;
        this.logger.error(errorMeta, message);
    }
    child(bindings) {
        const childLogger = this.logger.child(bindings);
        return new PinoLoggerChild(childLogger);
    }
};
exports.PinoLogger = PinoLogger;
exports.PinoLogger = PinoLogger = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Config)),
    __metadata("design:paramtypes", [Object])
], PinoLogger);
class PinoLoggerChild {
    constructor(logger) {
        this.logger = logger;
    }
    debug(message, meta) {
        this.logger.debug(meta, message);
    }
    info(message, meta) {
        this.logger.info(meta, message);
    }
    warn(message, meta) {
        this.logger.warn(meta, message);
    }
    error(message, error, meta) {
        const errorMeta = error ? {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            ...meta,
        } : meta;
        this.logger.error(errorMeta, message);
    }
    child(bindings) {
        return new PinoLoggerChild(this.logger.child(bindings));
    }
}
//# sourceMappingURL=pino-logger.js.map