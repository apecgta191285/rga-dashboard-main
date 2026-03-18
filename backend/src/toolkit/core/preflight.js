"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runToolkitPreflight = runToolkitPreflight;
const database_schema_util_1 = require("./database-schema.util");
const manifest_pipeline_1 = require("../manifest/manifest-pipeline");
const REQUIRED_COLUMNS = [
    { table: 'campaigns', columns: ['is_mock_data', 'source'] },
    { table: 'metrics', columns: ['is_mock_data', 'source'] },
];
function parseNodeMajor(version) {
    const major = Number.parseInt(version.replace(/^v/, '').split('.')[0] || '', 10);
    return Number.isFinite(major) ? major : null;
}
function maskHost(urlText) {
    if (!urlText)
        return 'MISSING_DATABASE_URL';
    try {
        const host = new URL(urlText).hostname;
        if (host.length <= 10)
            return host;
        return `${host.slice(0, 4)}***${host.slice(-4)}`;
    }
    catch {
        return 'INVALID_DATABASE_URL';
    }
}
async function runToolkitPreflight(prisma, options) {
    const requiredNodeMajor = options?.requiredNodeMajor ?? 20;
    const checks = [];
    const actions = [];
    const nodeMajor = parseNodeMajor(process.version);
    const nodePass = nodeMajor === requiredNodeMajor;
    checks.push({
        id: 'NODE_RUNTIME',
        status: nodePass ? 'PASS' : 'FAIL',
        message: nodePass
            ? `Node.js runtime is supported (${process.version})`
            : `Unsupported Node.js runtime ${process.version}; required ${requiredNodeMajor}.x`,
        details: {
            detected: process.version,
            required: `${requiredNodeMajor}.x`,
        },
    });
    if (!nodePass) {
        actions.push(`Switch Node.js to ${requiredNodeMajor}.x (see .nvmrc).`);
    }
    const safety = (0, manifest_pipeline_1.evaluateSafetyGates)();
    checks.push({
        id: 'SAFETY_GATES',
        status: safety.blocked ? 'FAIL' : 'PASS',
        message: safety.blocked
            ? `Safety blocked by ${safety.blockedGate}: ${safety.blockedReason}`
            : 'Safety gates allow write operations',
        details: {
            toolkitEnv: safety.safety.envSummary.toolkitEnv,
            dbHostMasked: safety.safety.dbSafetySummary.dbHostMasked,
            dbClassification: safety.safety.dbSafetySummary.classification,
        },
    });
    if (safety.blocked) {
        actions.push('Set TOOLKIT_ENV to LOCAL/DEV/CI and ensure DATABASE_URL host is allowlisted (or add to TOOLKIT_SAFE_DB_HOSTS).');
    }
    const schemaResolution = (0, database_schema_util_1.resolveTargetSchema)(process.env.DATABASE_URL);
    const schema = schemaResolution.schema;
    const schemaIdentifierPass = (0, database_schema_util_1.isValidSchemaIdentifier)(schema);
    checks.push({
        id: 'SCHEMA_IDENTIFIER',
        status: schemaIdentifierPass ? 'PASS' : 'FAIL',
        message: schemaIdentifierPass
            ? `Schema identifier is valid (${schema})`
            : `Invalid schema identifier "${schema}"`,
        details: {
            schema,
            source: schemaResolution.source,
            dbHostMasked: maskHost(process.env.DATABASE_URL),
        },
    });
    if (!schemaIdentifierPass) {
        actions.push('Set a valid schema query parameter in DATABASE_URL (e.g., ?schema=toolkit_dev).');
    }
    if (schemaIdentifierPass) {
        try {
            const { checks: columnChecks, missing } = await (0, database_schema_util_1.checkRequiredColumns)(prisma, schema, REQUIRED_COLUMNS);
            checks.push({
                id: 'SCHEMA_PARITY',
                status: missing.length === 0 ? 'PASS' : 'FAIL',
                message: missing.length === 0
                    ? `Schema parity passed for ${schema}`
                    : `Schema parity failed; missing columns: ${missing.join(', ')}`,
                details: {
                    schema,
                    dbHostMasked: maskHost(process.env.DATABASE_URL),
                    tableChecks: columnChecks,
                    missing,
                },
            });
            if (missing.length > 0) {
                actions.push('Run migrations for the target schema before seed/verify (toolkit:isolated:migrate).');
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            checks.push({
                id: 'SCHEMA_PARITY',
                status: 'FAIL',
                message: `Schema parity check failed: ${message}`,
                details: {
                    schema,
                    dbHostMasked: maskHost(process.env.DATABASE_URL),
                },
            });
            actions.push('Verify database connectivity and rerun toolkit preflight.');
        }
    }
    const ok = checks.every((check) => check.status === 'PASS');
    if (ok) {
        actions.push('GO: safe to run seed/verify commands on the current configuration.');
    }
    else {
        actions.push('NO-GO: fix failed checks before running write commands.');
    }
    return {
        ok,
        checkedAt: new Date().toISOString(),
        checks,
        actions,
    };
}
//# sourceMappingURL=preflight.js.map