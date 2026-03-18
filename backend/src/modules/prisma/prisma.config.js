"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaConfig = void 0;
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prismaConfig = {
    adapter,
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
    ],
    errorFormat: 'pretty',
};
//# sourceMappingURL=prisma.config.js.map