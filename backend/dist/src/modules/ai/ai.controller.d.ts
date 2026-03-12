import { AiService } from './ai.service';
import { CreateUserBehaviorDto } from './dto/create-user-behavior.dto';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { ListUserBehaviorQuery } from './dto/list-user-behavior.query';
import { ListAiRecommendationsQuery } from './dto/list-ai-recommendations.query';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    createBehavior(dto: CreateUserBehaviorDto, req: any): Promise<{
        data: import("@prisma/client/runtime/client").JsonValue | null;
        id: string;
        tenantId: string;
        userId: string;
        action: string;
        timestamp: Date;
    }>;
    listBehavior(query: ListUserBehaviorQuery, req: any): Promise<{
        items: {
            data: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            tenantId: string;
            userId: string;
            action: string;
            timestamp: Date;
        }[];
        nextCursor: string;
    }>;
    createRecommendation(dto: CreateAiRecommendationDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
        status: string;
        description: string;
        title: string;
        priority: string;
        payload: import("@prisma/client/runtime/client").JsonValue | null;
        confidence: import("@prisma/client-runtime-utils").Decimal;
        executedAt: Date | null;
    }>;
    listRecommendations(query: ListAiRecommendationsQuery, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            type: string;
            status: string;
            description: string;
            title: string;
            priority: string;
            payload: import("@prisma/client/runtime/client").JsonValue | null;
            confidence: import("@prisma/client-runtime-utils").Decimal;
            executedAt: Date | null;
        }[];
        nextCursor: string;
    }>;
}
