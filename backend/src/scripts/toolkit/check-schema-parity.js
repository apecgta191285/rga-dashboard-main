"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const database_schema_util_1 = require("../../toolkit/core/database-schema.util");
const REQUIRED_COLUMNS = [
    { table: 'campaigns', columns: ['is_mock_data', 'source'] },
    { table: 'metrics', columns: ['is_mock_data', 'source'] },
];
function maskDatabaseHost(databaseUrl) {
    if (!databaseUrl)
        return 'MISSING_DATABASE_URL';
    try {
        const host = new URL(databaseUrl).hostname;
        if (host.length <= 8)
            return host;
        return `${host.slice(0, 4)}***${host.slice(-4)}`;
    }
    catch {
        return 'INVALID_DATABASE_URL';
    }
}
async function main() {
    const prisma = new client_1.PrismaClient();
    const schemaResolution = (0, database_schema_util_1.resolveTargetSchema)(process.env.DATABASE_URL);
    const targetSchema = schemaResolution.schema;
    if (!(0, database_schema_util_1.isValidSchemaIdentifier)(targetSchema)) {
        console.error(JSON.stringify({
            ok: false,
            checkedAt: new Date().toISOString(),
            dbHostMasked: maskDatabaseHost(process.env.DATABASE_URL),
            schema: targetSchema,
            error: `Invalid schema identifier "${targetSchema}"`,
        }, null, 2));
        process.exit(1);
    }
    try {
        const { checks, missing } = await (0, database_schema_util_1.checkRequiredColumns)(prisma, targetSchema, REQUIRED_COLUMNS);
        const ok = missing.length === 0;
        console.log(JSON.stringify({
            ok,
            checkedAt: new Date().toISOString(),
            dbHostMasked: maskDatabaseHost(process.env.DATABASE_URL),
            schema: targetSchema,
            schemaSource: schemaResolution.source,
            checks,
            missing,
        }, null, 2));
        process.exit(ok ? 0 : 1);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({
            ok: false,
            checkedAt: new Date().toISOString(),
            dbHostMasked: maskDatabaseHost(process.env.DATABASE_URL),
            schema: targetSchema,
            schemaSource: schemaResolution.source,
            error: message,
        }, null, 2));
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=check-schema-parity.js.map