
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.webAnalyticsDaily.count();
    const dates = await prisma.webAnalyticsDaily.aggregate({
        _min: { date: true },
        _max: { date: true },
    });

    console.log('Total Records:', count);
    console.log('Min Date:', dates._min.date);
    console.log('Max Date:', dates._max.date);

    const today = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const prevStart = new Date();
    prevStart.setDate(prevStart.getDate() - 60);

    console.log('Current Period Start:', start);
    console.log('Previous Period Start:', prevStart);

    const currentData = await prisma.webAnalyticsDaily.aggregate({
        where: { date: { gte: start } },
        _sum: { sessions: true }
    });

    const prevData = await prisma.webAnalyticsDaily.aggregate({
        where: { date: { gte: prevStart, lt: start } },
        _sum: { sessions: true }
    });

    console.log('Current Sessions Sum:', currentData._sum.sessions);
    console.log('Previous Sessions Sum:', prevData._sum.sessions);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
