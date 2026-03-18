import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma-health.indicator';
export declare class HealthController {
    private health;
    private db;
    private memory;
    constructor(health: HealthCheckService, db: PrismaHealthIndicator, memory: MemoryHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    liveness(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
    readiness(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
