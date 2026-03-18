import { ChatService } from './chat.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    createSession(createSessionDto: CreateChatSessionDto, req: any): Promise<({
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
    }) | {
        message: string;
    }>;
    getSessions(queryUserId: string, req: any): Promise<({
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
    addMessage(createMessageDto: CreateChatMessageDto, req: any): Promise<{
        role: string;
        id: string;
        createdAt: Date;
        content: string;
        sessionId: string;
    } | {
        message: string;
    }>;
}
