"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTargetSchema = resolveTargetSchema;
exports.isValidSchemaIdentifier = isValidSchemaIdentifier;
exports.getMissingColumns = getMissingColumns;
exports.checkRequiredColumns = checkRequiredColumns;
const client_1 = require("@prisma/client");
const DEFAULT_SCHEMA = 'public';
const SCHEMA_IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
function resolveTargetSchema(databaseUrl) {
    if (!databaseUrl) {
        return { schema: DEFAULT_SCHEMA, source: 'default' };
    }
    try {
        const parsed = new URL(databaseUrl);
        const schema = parsed.searchParams.get('schema')?.trim();
        if (schema && schema.length > 0) {
            return { schema, source: 'url' };
        }
        return { schema: DEFAULT_SCHEMA, source: 'default' };
    }
    catch {
        return { schema: DEFAULT_SCHEMA, source: 'invalid_url' };
    }
}
function isValidSchemaIdentifier(schema) {
    return SCHEMA_IDENTIFIER_REGEX.test(schema);
}
async function getMissingColumns(prisma, schema, table, requiredColumns) {
    const rows = await prisma.$queryRaw(client_1.Prisma.sql `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = ${schema}
              AND table_name = ${table}
              AND column_name IN (${client_1.Prisma.join(requiredColumns)})
        `);
    const present = new Set(rows.map((row) => row.column_name));
    return requiredColumns.filter((column) => !present.has(column));
}
async function checkRequiredColumns(prisma, schema, requirements) {
    const checks = [];
    const missing = [];
    for (const requirement of requirements) {
        const missingColumns = await getMissingColumns(prisma, schema, requirement.table, requirement.columns);
        checks.push({
            table: requirement.table,
            required: requirement.columns,
            missing: missingColumns,
        });
        for (const column of missingColumns) {
            missing.push(`${requirement.table}.${column}`);
        }
    }
    return { checks, missing };
}
//# sourceMappingURL=database-schema.util.js.map