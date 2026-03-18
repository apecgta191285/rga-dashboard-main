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
exports.ManifestWriter = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const output_path_policy_1 = require("../core/output-path-policy");
const redactor_1 = require("./redactor");
const DEFAULT_MANIFEST_DIR = './toolkit-manifests';
const ORPHAN_MAX_AGE_MS = 60 * 60 * 1000;
class ManifestWriter {
    static serialize(manifest) {
        const maxBytes = redactor_1.TRUNCATION_LIMITS.MAX_MANIFEST_BYTES;
        const json = JSON.stringify(manifest, null, 2);
        const sizeBytes = Buffer.byteLength(json, 'utf8');
        if (sizeBytes > maxBytes) {
            return { json: null, sizeBytes, maxBytes };
        }
        return { json, sizeBytes, maxBytes };
    }
    static resolveDir(flagValue) {
        if (flagValue) {
            return (0, output_path_policy_1.resolveOutputDir)('manifest', flagValue);
        }
        const envDir = process.env.TOOLKIT_MANIFEST_DIR;
        return (0, output_path_policy_1.resolveOutputDir)('manifest', envDir ?? null);
    }
    static generateFilename(runId, commandName) {
        const now = new Date();
        const ts = now.toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d+Z$/, 'Z');
        const safeName = commandName.replace(/[^a-z0-9-]/gi, '_');
        return `${runId}_${safeName}_${ts}.manifest.json`;
    }
    static async write(manifest, manifestDir) {
        let dir;
        try {
            if (manifestDir) {
                dir = (0, output_path_policy_1.resolveOutputDir)('manifest', manifestDir);
            }
            else {
                dir = ManifestWriter.resolveDir(manifest.invocation.flags.manifestDir);
            }
        }
        catch (pathErr) {
            process.stderr.write(`[manifest] Warning: output path blocked by policy: ${pathErr instanceof Error ? pathErr.message : String(pathErr)}\n`);
            return null;
        }
        try {
            await fs_1.promises.mkdir(dir, { recursive: true });
        }
        catch (mkdirErr) {
            process.stderr.write(`[manifest] Warning: failed to create directory ${dir}: ${mkdirErr instanceof Error ? mkdirErr.message : String(mkdirErr)}\n`);
            return null;
        }
        const filename = ManifestWriter.generateFilename(manifest.runId, manifest.invocation.commandName);
        const finalPath = path.join(dir, filename);
        const tempPath = path.join(dir, `.tmp_${manifest.runId}.json`);
        try {
            const serialized = ManifestWriter.serialize(manifest);
            if (!serialized.json) {
                process.stderr.write(`[manifest] Warning: manifest size ${serialized.sizeBytes} exceeds cap ${serialized.maxBytes}; skip write\n`);
                return null;
            }
            const json = serialized.json;
            await fs_1.promises.writeFile(tempPath, json, 'utf-8');
            let fd = null;
            try {
                fd = await fs_1.promises.open(tempPath, 'r');
                await fd.datasync();
            }
            catch {
            }
            finally {
                if (fd) {
                    await fd.close().catch(() => { });
                }
            }
            await fs_1.promises.rename(tempPath, finalPath);
            return finalPath;
        }
        catch (writeErr) {
            process.stderr.write(`[manifest] Warning: failed to write manifest: ${writeErr instanceof Error ? writeErr.message : String(writeErr)}\n`);
            try {
                await fs_1.promises.unlink(tempPath);
            }
            catch {
            }
            return null;
        }
    }
    static async cleanupOrphans(dir, maxAgeMs = ORPHAN_MAX_AGE_MS) {
        let cleaned = 0;
        try {
            await fs_1.promises.access(dir, fs_1.constants.R_OK);
            const files = await fs_1.promises.readdir(dir);
            const orphans = files.filter(f => f.startsWith('.tmp_'));
            const cutoff = Date.now() - maxAgeMs;
            for (const file of orphans) {
                try {
                    const filePath = path.join(dir, file);
                    const stat = await fs_1.promises.stat(filePath);
                    if (stat.mtimeMs < cutoff) {
                        await fs_1.promises.unlink(filePath);
                        cleaned++;
                    }
                }
                catch {
                }
            }
        }
        catch {
        }
        return cleaned;
    }
}
exports.ManifestWriter = ManifestWriter;
//# sourceMappingURL=manifest-writer.js.map