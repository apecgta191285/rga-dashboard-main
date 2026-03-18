"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaParityPreflightError = void 0;
exports.assertToolkitWriteSchemaParity = assertToolkitWriteSchemaParity;
const contracts_1 = require("./contracts");
const database_schema_util_1 = require("./database-schema.util");
const TOOLKIT_WRITE_REQUIREMENTS = [
    { table: 'campaigns', columns: ['is_mock_data', 'source'] },
    { table: 'metrics', columns: ['is_mock_data', 'source'] },
];
class SchemaParityPreflightError extends contracts_1.ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'SCHEMA_PARITY_VIOLATION';
        this.isRecoverable = false;
    }
}
exports.SchemaParityPreflightError = SchemaParityPreflightError;
async function assertToolkitWriteSchemaParity(prisma) {
    const schemaResolution = (0, database_schema_util_1.resolveTargetSchema)(process.env.DATABASE_URL);
    const targetSchema = schemaResolution.schema;
    if (!(0, database_schema_util_1.isValidSchemaIdentifier)(targetSchema)) {
        throw new SchemaParityPreflightError(`Database schema parity failed. Invalid schema identifier "${targetSchema}".`);
    }
    const { missing } = await (0, database_schema_util_1.checkRequiredColumns)(prisma, targetSchema, TOOLKIT_WRITE_REQUIREMENTS);
    if (missing.length > 0) {
        throw new SchemaParityPreflightError(`Database schema parity failed for schema "${targetSchema}". ` +
            `Missing required columns: ${missing.join(', ')}. ` +
            'Apply Prisma migrations before running toolkit write commands.');
    }
}
//# sourceMappingURL=write-schema-preflight.js.map