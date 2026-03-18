import { PrismaClient } from '@prisma/client';
import { ToolkitError } from './contracts';
export declare class SchemaParityPreflightError extends ToolkitError {
    readonly code = "SCHEMA_PARITY_VIOLATION";
    readonly isRecoverable = false;
}
export declare function assertToolkitWriteSchemaParity(prisma: PrismaClient): Promise<void>;
