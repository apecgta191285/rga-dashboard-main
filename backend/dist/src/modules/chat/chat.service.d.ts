import { PrismaService } from '../prisma/prisma.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
export declare class ChatService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSession(tenantId: string, userId: string | null, createSessionDto: CreateChatSessionDto): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            role: string;
            content: string;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        userId: string | null;
    }>;
    getSessions(userId: string | null): Promise<({
        _count: {
            messages: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        userId: string | null;
    })[]>;
    getSession(id: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            role: string;
            content: string;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        userId: string | null;
    }>;
    addMessage(tenantId: string, sessionId: string, createMessageDto: CreateChatMessageDto): Promise<{
        id: string;
        createdAt: Date;
        role: string;
        content: string;
        sessionId: string;
    }>;
    updateSessionTitle(id: string, title: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        userId: string | null;
    }>;
    deleteSession(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        userId: string | null;
    }>;
}
