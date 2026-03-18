"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveBuilder = getActiveBuilder;
exports.emergencyFinalizeAndWrite = emergencyFinalizeAndWrite;
exports.evaluateSafetyGates = evaluateSafetyGates;
exports.executeWithManifest = executeWithManifest;
const manifest_builder_1 = require("./manifest-builder");
const manifest_writer_1 = require("./manifest-writer");
let activeBuilder = null;
function getActiveBuilder() {
    return activeBuilder;
}
function emergencyFinalizeAndWrite(signal) {
    if (!activeBuilder || activeBuilder.isFinalized())
        return;
    const status = signal === 'SIGINT' ? 'CANCELLED' : 'FAILED';
    const exitCode = signal === 'SIGINT' ? 130 : 1;
    activeBuilder.addWarning(`Emergency finalize triggered by ${signal}`);
    const doc = activeBuilder.finalize(status, exitCode);
    try {
        const dir = manifest_writer_1.ManifestWriter.resolveDir(doc.invocation.flags.manifestDir);
        const fs = require('fs');
        const path = require('path');
        try {
            fs.mkdirSync(dir, { recursive: true });
        }
        catch {
            return;
        }
        const filename = manifest_writer_1.ManifestWriter.generateFilename(doc.runId, doc.invocation.commandName);
        const finalPath = path.join(dir, filename);
        const serialized = manifest_writer_1.ManifestWriter.serialize(doc);
        if (!serialized.json) {
            process.stderr.write(`[manifest] Warning: emergency manifest size ${serialized.sizeBytes} exceeds cap ${serialized.maxBytes}\n`);
            activeBuilder = null;
            return;
        }
        const json = serialized.json;
        fs.writeFileSync(finalPath, json, 'utf-8');
        process.stderr.write(`[manifest] Emergency manifest written: ${finalPath}\n`);
    }
    catch {
        process.stderr.write(`[manifest] Warning: emergency manifest write failed\n`);
    }
    activeBuilder = null;
}
const BLOCKED_HOSTS = [
    '.supabase.co',
    '.supabase.com',
    '.rds.amazonaws.com',
    '.gcp.cloud',
    '.azure.com',
    '.neon.tech',
];
const ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '::1',
    'host.docker.internal',
    'db',
    'postgres',
];
function classifyHost(hostname, safeHosts) {
    const lower = hostname.toLowerCase();
    if (safeHosts) {
        for (const host of safeHosts) {
            if (lower === host.toLowerCase()) {
                return { classification: 'ALLOWED', matchedRule: `custom:${host}` };
            }
        }
    }
    for (const pattern of BLOCKED_HOSTS) {
        if (lower.endsWith(pattern) || lower === pattern.slice(1)) {
            return { classification: 'BLOCKED', matchedRule: `blocklist:${pattern}` };
        }
    }
    for (const host of ALLOWED_HOSTS) {
        if (lower === host) {
            return { classification: 'ALLOWED', matchedRule: `allowlist:${host}` };
        }
    }
    return { classification: 'UNKNOWN', matchedRule: null };
}
function parseDatabaseHost(url) {
    try {
        const parsed = new URL(url);
        return {
            hostname: parsed.hostname,
            dbName: parsed.pathname.replace(/^\//, ''),
        };
    }
    catch {
        return { hostname: 'UNPARSEABLE', dbName: 'UNPARSEABLE' };
    }
}
function evaluateSafetyGates(options) {
    const toolkitEnv = options?.toolkitEnv ?? process.env.TOOLKIT_ENV ?? undefined;
    const databaseUrl = options?.databaseUrl ?? process.env.DATABASE_URL ?? '';
    const safeDbHosts = options?.safeDbHosts ?? process.env.TOOLKIT_SAFE_DB_HOSTS?.split(',').map(h => h.trim()).filter(Boolean);
    const WRITABLE_ENVS = new Set(['LOCAL', 'DEV', 'CI']);
    const envUpper = toolkitEnv?.toUpperCase() ?? null;
    const envAllowed = envUpper !== null && WRITABLE_ENVS.has(envUpper);
    const envGate = {
        name: 'TOOLKIT_ENV',
        passed: envAllowed,
        reasonCode: envUpper === null ? 'MISSING_ENV'
            : envAllowed ? 'ALLOWED'
                : 'BLOCKED_ENV',
        reasonMessage: envUpper === null
            ? 'TOOLKIT_ENV is not set. Set to LOCAL, DEV, or CI to allow writes.'
            : envAllowed
                ? `TOOLKIT_ENV=${envUpper} is in the writable allowlist.`
                : `TOOLKIT_ENV=${envUpper} is not in the writable allowlist [LOCAL, DEV, CI].`,
    };
    const { hostname, dbName } = parseDatabaseHost(databaseUrl);
    const hostResult = classifyHost(hostname, safeDbHosts);
    const dbGatePassed = hostResult.classification === 'ALLOWED';
    const dbGate = {
        name: 'DATABASE_URL',
        passed: dbGatePassed,
        reasonCode: hostResult.classification === 'ALLOWED' ? 'ALLOWED'
            : hostResult.classification === 'BLOCKED' ? 'BLOCKED_HOST'
                : 'UNKNOWN_HOST',
        reasonMessage: dbGatePassed
            ? `Host '${hostname}' is in the safe allowlist.`
            : hostResult.classification === 'BLOCKED'
                ? `Host '${hostname}' matches blocked pattern ${hostResult.matchedRule}. Production databases are not allowed.`
                : `Host '${hostname}' is not in the allowlist. Add to TOOLKIT_SAFE_DB_HOSTS if intentional.`,
    };
    const blocked = !envGate.passed || !dbGate.passed;
    const blockedGate = !envGate.passed ? 'TOOLKIT_ENV' : !dbGate.passed ? 'DATABASE_URL' : null;
    const blockedReason = !envGate.passed ? envGate.reasonMessage : !dbGate.passed ? dbGate.reasonMessage : null;
    const dbClassification = hostResult.classification === 'ALLOWED' ? 'SAFE'
        : hostResult.classification === 'BLOCKED' ? 'UNSAFE'
            : 'UNKNOWN';
    return {
        safety: {
            policyVersion: '1.0.0',
            gates: [envGate, dbGate],
            envSummary: {
                toolkitEnv: envUpper,
                classification: envUpper === null ? 'MISSING' : envAllowed ? 'ALLOWED' : 'BLOCKED',
            },
            dbSafetySummary: {
                dbHostMasked: hostname,
                dbNameMasked: dbName,
                classification: dbClassification,
                matchedRule: hostResult.matchedRule,
            },
        },
        blocked,
        blockedGate,
        blockedReason,
    };
}
async function executeWithManifest(options) {
    const builder = new manifest_builder_1.ManifestBuilder(options.config);
    activeBuilder = builder;
    let status = 'BLOCKED';
    let exitCode = 78;
    try {
        if (!options.skipSafety) {
            const safetyStep = builder.startStep('SAFETY_CHECK');
            const safetyResult = evaluateSafetyGates(options.safetyOptions);
            builder.setSafety(safetyResult.safety);
            if (safetyResult.blocked) {
                safetyStep.close({
                    status: 'FAILED',
                    summary: `Gate ${safetyResult.blockedGate} blocked: ${safetyResult.blockedReason}`,
                    error: {
                        code: 'SAFETY_BLOCK',
                        message: safetyResult.blockedReason || 'Safety gate blocked execution',
                        isRecoverable: false,
                    },
                });
                builder.addError({
                    code: 'SAFETY_BLOCK',
                    message: `Execution blocked by safety gate: ${safetyResult.blockedReason}`,
                    isRecoverable: false,
                });
                status = 'BLOCKED';
                exitCode = 78;
                return buildResult(builder, status, exitCode, options.manifestDir);
            }
            safetyStep.close({ status: 'SUCCESS', summary: 'All safety gates passed' });
        }
        else {
            const safetyStep = builder.startStep('SAFETY_CHECK');
            safetyStep.close({ status: 'SKIPPED', summary: 'Skipped for read-only command' });
        }
        const result = await options.execute(builder);
        status = result.status;
        exitCode = result.exitCode;
        return buildResult(builder, status, exitCode, options.manifestDir);
    }
    catch (error) {
        builder.addError(error);
        status = 'FAILED';
        exitCode = 1;
        return buildResult(builder, status, exitCode, options.manifestDir);
    }
    finally {
        activeBuilder = null;
    }
}
async function buildResult(builder, status, exitCode, manifestDir) {
    const manifest = builder.finalize(status, exitCode);
    const manifestPath = await manifest_writer_1.ManifestWriter.write(manifest, manifestDir);
    if (manifestPath) {
        process.stderr.write(`[manifest] Written: ${manifestPath}\n`);
    }
    return { status, exitCode, manifestPath, manifest };
}
//# sourceMappingURL=manifest-pipeline.js.map