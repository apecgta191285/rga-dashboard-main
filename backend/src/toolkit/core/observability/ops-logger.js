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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinoOpsLogger = void 0;
const pino_1 = __importDefault(require("pino"));
const Redactor = __importStar(require("../../manifest/redactor"));
class PinoOpsLogger {
    constructor(env, bindings = {}) {
        const destination = env === 'CI' ? pino_1.default.destination(1) : pino_1.default.destination(2);
        const transport = env === 'LOCAL'
            ? pino_1.default.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            })
            : undefined;
        this.logger = (0, pino_1.default)({
            level: process.env.LOG_LEVEL || 'info',
            base: {
                env,
                ...bindings,
            },
            serializers: {
                err: (err) => {
                    const sanitized = Redactor.sanitizeError(err);
                    return {
                        type: 'Error',
                        message: sanitized.message,
                        code: sanitized.code,
                    };
                },
            },
            hooks: {
                logMethod(inputArgs, method, level) {
                    if (inputArgs.length >= 2 && typeof inputArgs[0] === 'object' && inputArgs[0] !== null) {
                        const originalObj = inputArgs[0];
                        inputArgs[0] = Redactor.redactArgs(originalObj);
                    }
                    return method.apply(this, inputArgs);
                }
            }
        }, transport || destination);
    }
    info(arg1, arg2) {
        this.logger.info(arg1, arg2);
    }
    warn(arg1, arg2) {
        this.logger.warn(arg1, arg2);
    }
    error(arg1, arg2) {
        this.logger.error(arg1, arg2);
    }
    debug(arg1, arg2) {
        this.logger.debug(arg1, arg2);
    }
    child(bindings) {
        const redactedBindings = Redactor.redactArgs(bindings);
        const childPino = this.logger.child(redactedBindings);
        return new PinoLoggerWrapper(childPino);
    }
}
exports.PinoOpsLogger = PinoOpsLogger;
class PinoLoggerWrapper {
    constructor(logger) {
        this.logger = logger;
    }
    info(arg1, arg2) {
        this.logger.info(arg1, arg2);
    }
    warn(arg1, arg2) {
        this.logger.warn(arg1, arg2);
    }
    error(arg1, arg2) {
        this.logger.error(arg1, arg2);
    }
    debug(arg1, arg2) {
        this.logger.debug(arg1, arg2);
    }
    child(bindings) {
        const redactedBindings = Redactor.redactArgs(bindings);
        return new PinoLoggerWrapper(this.logger.child(redactedBindings));
    }
}
//# sourceMappingURL=ops-logger.js.map