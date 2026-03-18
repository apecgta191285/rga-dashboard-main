"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixDuplicateWebAnalytics() {
    try {
        console.log('🔧 Fixing duplicate WebAnalyticsDaily data...');
        const allRecords = await prisma.webAnalyticsDaily.findMany({
            orderBy: { date: 'asc' }
        });
        console.log(`Found ${allRecords.length} total records`);
        const grouped = new Map();
        allRecords.forEach(record => {
            const dateStr = record.date.toISOString().split('T')[0];
            const key = `${record.tenantId}-${dateStr}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(record);
        });
        await prisma.webAnalyticsDaily.deleteMany({});
        console.log('Deleted all existing WebAnalyticsDaily records');
        const newRecords = [];
        for (const [key, records] of grouped) {
            const [tenantId, dateStr] = key.split('-');
            const date = new Date(dateStr + 'T00:00:00.000Z');
            const avgSessions = records.reduce((sum, r) => sum + r.sessions, 0) / records.length;
            const avgNewUsers = records.reduce((sum, r) => sum + r.newUsers, 0) / records.length;
            const avgAvgSessionDuration = records.reduce((sum, r) => sum + Number(r.avgSessionDuration || 0), 0) / records.length;
            const avgBounceRate = records.reduce((sum, r) => sum + Number(r.bounceRate || 0), 0) / records.length;
            newRecords.push({
                tenantId,
                propertyId: `GA4-${tenantId}`,
                date,
                sessions: Math.floor(avgSessions),
                newUsers: Math.floor(avgNewUsers),
                avgSessionDuration: avgAvgSessionDuration,
                bounceRate: avgBounceRate,
            });
        }
        await prisma.webAnalyticsDaily.createMany({
            data: newRecords
        });
        console.log(`✅ Created ${newRecords.length} clean records`);
        console.log('🎉 WebAnalyticsDaily data fixed successfully!');
    }
    catch (error) {
        console.error('❌ Error fixing WebAnalyticsDaily:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixDuplicateWebAnalytics();
//# sourceMappingURL=fix-duplicate-webanalytics.js.map