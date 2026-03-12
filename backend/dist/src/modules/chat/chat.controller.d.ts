import { ChatService } from './chat.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    createSession(createSessionDto: CreateChatSessionDto, req: any): Promise<({
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
    }) | {
        message: string;
    }>;
    getSessions(queryUserId: string, req: any): Promise<({
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
    addMessage(createMessageDto: CreateChatMessageDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        role: string;
        content: string;
        sessionId: string;
    } | {
        message: string;
    }>;
}
