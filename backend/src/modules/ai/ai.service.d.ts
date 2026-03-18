import { PrismaService } from '../prisma/prisma.service';
import { CreateUserBehaviorDto } from './dto/create-user-behavior.dto';
import { ListUserBehaviorQuery } from './dto/list-user-behavior.query';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { ListAiRecommendationsQuery } from './dto/list-ai-recommendations.query';
export declare class AiService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createUserBehavior(tenantId: string, userId: string, dto: CreateUserBehaviorDto): Promise<{
        id: string;
        tenantId: string;
        data: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
        action: string;
        timestamp: Date;
    }>;
    listUserBehavior(tenantId: string, userId: string, query: ListUserBehaviorQuery): Promise<{
        items: {
            id: string;
            tenantId: string;
            data: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string;
            action: string;
            timestamp: Date;
        }[];
        nextCursor: string;
    }>;
    createAiRecommendation(tenantId: string, dto: CreateAiRecommendationDto): Promise<{
        description: string;
        type: string;
        title: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: string;
        payload: import("@prisma/client/runtime/client").JsonValue | null;
        confidence: import("@prisma/client-runtime-utils").Decimal;
        executedAt: Date | null;
    }>;
    listAiRecommendations(tenantId: string, query: ListAiRecommendationsQuery): Promise<{
        items: {
            description: string;
            type: string;
            title: string;
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            priority: string;
            payload: import("@prisma/client/runtime/client").JsonValue | null;
            confidence: import("@prisma/client-runtime-utils").Decimal;
            executedAt: Date | null;
        }[];
        nextCursor: string;
    }>;
}
