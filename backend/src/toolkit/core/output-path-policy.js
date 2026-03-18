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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputPathPolicyError = void 0;
exports.getDefaultOutputRoot = getDefaultOutputRoot;
exports.getAllowedOutputRoots = getAllowedOutputRoots;
exports.resolveOutputDir = resolveOutputDir;
const path = __importStar(require("path"));
class OutputPathPolicyError extends Error {
    constructor(message) {
        super(message);
        this.code = 'OUTPUT_PATH_BLOCKED';
        this.exitCode = 78;
        this.name = 'OutputPathPolicyError';
    }
}
exports.OutputPathPolicyError = OutputPathPolicyError;
function isSubPath(root, candidate) {
    const rel = path.relative(root, candidate);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
function parseRootsFromEnv(envVar) {
    if (!envVar)
        return [];
    return envVar
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => path.resolve(v));
}
function unique(values) {
    return Array.from(new Set(values));
}
function getDefaultOutputRoot(kind) {
    if (kind === 'manifest') {
        return path.resolve(process.cwd(), 'toolkit-manifests');
    }
    return path.resolve(process.cwd(), 'artifacts', 'reports');
}
function getAllowedOutputRoots(kind) {
    const defaultRoot = getDefaultOutputRoot(kind);
    const envVar = kind === 'manifest'
        ? process.env.TOOLKIT_ALLOWED_MANIFEST_ROOTS
        : process.env.TOOLKIT_ALLOWED_REPORT_ROOTS;
    const extraRoots = parseRootsFromEnv(envVar);
    return unique([defaultRoot, ...extraRoots]);
}
function resolveOutputDir(kind, requestedDir) {
    const resolved = requestedDir
        ? path.resolve(requestedDir)
        : getDefaultOutputRoot(kind);
    const allowedRoots = getAllowedOutputRoots(kind);
    const allowed = allowedRoots.some(root => isSubPath(root, resolved));
    if (!allowed) {
        const roots = allowedRoots.join(', ');
        throw new OutputPathPolicyError(`Output path "${resolved}" is outside allowlisted ${kind} roots: [${roots}]`);
    }
    return resolved;
}
//# sourceMappingURL=output-path-policy.js.map