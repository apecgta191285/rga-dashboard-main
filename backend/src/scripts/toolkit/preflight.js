"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const preflight_1 = require("../../toolkit/core/preflight");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const result = await (0, preflight_1.runToolkitPreflight)(prisma, { requiredNodeMajor: 20 });
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.ok ? 0 : 1);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({
            ok: false,
            checkedAt: new Date().toISOString(),
            checks: [
                {
                    id: 'PREFLIGHT_RUNTIME',
                    status: 'FAIL',
                    message,
                },
            ],
            actions: ['Investigate runtime error and rerun toolkit preflight.'],
        }, null, 2));
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=preflight.js.map