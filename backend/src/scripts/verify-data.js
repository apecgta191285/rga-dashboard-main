"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const fs = require('fs');
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('verification_output.txt', msg + '\n');
    };
    log('🔍 Verifying WebAnalyticsDaily Data...');
    const count = await prisma.webAnalyticsDaily.count();
    log(`Total Records: ${count}`);
    const metadataCountResult = await prisma.$queryRaw `SELECT COUNT(*) as count FROM web_analytics_daily WHERE metadata IS NOT NULL`;
    log(`Records with Metadata: ${Number(metadataCountResult[0].count)}`);
    const sample = await prisma.$queryRaw `SELECT * FROM web_analytics_daily WHERE metadata IS NOT NULL LIMIT 1`;
    if (sample.length > 0) {
        log('Has Sample with Metadata: ' + JSON.stringify(sample[0].metadata, null, 2));
    }
    else {
        log('❌ NO RECORD WITH METADATA FOUND.');
    }
    const intentCount = await prisma.seoSearchIntent.count();
    log(`Total SeoSearchIntent Records: ${intentCount}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=verify-data.js.map