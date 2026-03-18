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
exports.ConsoleUiPrinter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const Redactor = __importStar(require("../../manifest/redactor"));
class ConsoleUiPrinter {
    constructor(env) {
        this.env = env;
    }
    log(message) {
        if (this.env === 'CI') {
            console.error(message);
        }
        else {
            console.log(message);
        }
    }
    warn(message) {
        const sanitized = message;
        if (this.env === 'CI') {
            console.error(chalk_1.default.yellow(sanitized));
        }
        else {
            console.log(chalk_1.default.yellow(sanitized));
        }
    }
    error(message) {
        const safeMessage = Redactor.scrubMessage(message);
        if (this.env === 'CI') {
            console.error(chalk_1.default.red(safeMessage));
        }
        else {
            console.error(chalk_1.default.red(safeMessage));
        }
    }
    header(text) {
        if (this.env === 'CI')
            return;
        console.log(text);
    }
    spinner(text) {
        if (this.env === 'CI') {
            console.error(`[START] ${text}`);
            return {
                start: () => { },
                succeed: (t) => console.error(`[SUCCESS] ${t || text}`),
                fail: (t) => console.error(`[FAIL] ${t || text}`),
                stop: () => { },
            };
        }
        const spinner = (0, ora_1.default)(text);
        return {
            start: () => spinner.start(),
            succeed: (t) => spinner.succeed(t),
            fail: (t) => spinner.fail(t),
            stop: () => spinner.stop(),
        };
    }
}
exports.ConsoleUiPrinter = ConsoleUiPrinter;
//# sourceMappingURL=ui-printer.js.map