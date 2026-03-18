import { PrismaService } from '../prisma/prisma.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
export declare class ChatService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSession(tenantId: string, userId: string | null, createSessionDto: CreateChatSessionDto): Promise<{
        messages: {
            role: string;
            id: string;
            createdAt: Date;
            content: string;
            sessionId: string;
        }[];
    } & {
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
    }>;
    getSessions(userId: string | null): Promise<({
        _count: {
            messages: number;
        };
    } & {
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
    })[]>;
    getSession(id: string): Promise<{
        messages: {
            role: string;
            id: string;
            createdAt: Date;
            content: string;
            sessionId: string;
        }[];
    } & {
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
    }>;
    addMessage(tenantId: string, sessionId: string, createMessageDto: CreateChatMessageDto): Promise<{
        role: string;
        id: string;
        createdAt: Date;
        content: string;
        sessionId: string;
    }>;
    updateSessionTitle(id: string, title: string): Promise<{
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
    }>;
    deleteSession(id: string): Promise<{
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
    }>;
}
