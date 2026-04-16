
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(private prisma: PrismaService) { }

    async createSession(tenantId: string, userId: string | null, createSessionDto: CreateChatSessionDto) {
        if (!userId) {
            throw new NotFoundException('Cannot create chat session without user');
        }
        return this.prisma.chatSession.create({
            data: {
                userId,
                title: createSessionDto.title || 'New Chat',
            },
            include: {
                messages: true,
            },
        });
    }

    async getSessions(userId: string | null) {
        if (!userId) {
            // For guests, we might not be able to list sessions easily unless we pass session IDs from client
            // Or we just return empty
            return [];
        }
        return this.prisma.chatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { messages: true },
                },
            },
        });
    }

    async getSession(id: string) {
        const session = await this.prisma.chatSession.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!session) {
            throw new NotFoundException(`Chat session with ID ${id} not found`);
        }

        return session;
    }

    async addMessage(tenantId: string, sessionId: string, createMessageDto: CreateChatMessageDto) {
    // 1. Verify session exists
    const session = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }

    // 2. Save user message
    const userMessage = await this.prisma.chatMessage.create({
        data: {
            sessionId,
            role: createMessageDto.role,
            content: createMessageDto.content,
        },
    });

    // 🔥 3. Call n8n (AI)
    let aiReply = 'no response';

    try {
        // Use environment variables for n8n configuration
        const n8nBaseUrl = process.env.N8N_BASE_URL || 'https://suttipatrga.app.n8n.cloud';
        // Chat module should call chat webhook; keep legacy var as fallback.
        const n8nWebhookPath =
            process.env.N8N_CHAT_WEBHOOK_PATH ||
            process.env.N8N_WEBHOOK_PATH ||
            'webhook/chat-seo';
        // IMPORTANT: do not normalize `//` globally (would break `https://` -> `https:/`)
        const n8nUrl = `${n8nBaseUrl.replace(/\/+$/, '')}/${n8nWebhookPath.replace(/^\/+/, '')}`;
        
        this.logger.log(`Calling n8n at: ${n8nUrl}`);
        
        const res = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: sessionId,
                tenant_id: tenantId,
                question: createMessageDto.content,
            }),
        });

        const text = await res.text();
        
        this.logger.log(`N8N Status: ${res.status}`);
        this.logger.log(`N8N Raw Response: ${text}`);
        
        // Check if response is empty
        if (!text || text.trim() === '') {
            this.logger.warn('N8N returned empty response');
            this.logger.warn(`N8N status: ${res.status}`);
            this.logger.warn(`N8N headers: ${JSON.stringify(Object.fromEntries(res.headers.entries()))}`);
            aiReply = 'ไม่ได้รับข้อมูลจาก AI';
        } else {
            try {
                const data = JSON.parse(text);
                this.logger.log('N8N Parsed Response:', JSON.stringify(data, null, 2));

                // 🔥 รองรับ Gemini format และ custom format
                aiReply =
                    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                    data?.answer ||
                    data?.reply ||
                    data?.output ||
                    data?.response ||
                    data?.message ||
                    data?.text ||
                    'ไม่พบคำตอบ';
                
                // ถ้ายังคงเป็น template expression ให้ fallback
                if (typeof aiReply === 'string' && (aiReply.includes('{{') && aiReply.includes('}}'))) {
                    this.logger.error('❌ N8N WEBHOOK ERROR: Response contains unevaluated template expression!');
                    this.logger.error('Received:', aiReply);
                    this.logger.error('SOLUTION: In n8n "Respond to webhook" node - Use Expression Editor (click ab icon)');
                    this.logger.error('Then set body to evaluate: { "answer": $json.candidates[0].content.parts[0].text }');
                    aiReply = 'N8N Webhook ไม่ได้ configure ถูก - ต้องใช้ Expression Editor';
                } else if (aiReply.includes('$json') || aiReply.includes('no response')) {
                    this.logger.warn('N8N returned template expression or fallback:', aiReply);
                    aiReply = 'ไม่สามารถได้รับคำตอบจาก Gemini - โปรดลองใหม่';
                }
                    
                this.logger.log('Final AI Reply:', aiReply);
            } catch (parseErr) {
                this.logger.warn('Failed to parse N8N response as JSON:', parseErr);
                this.logger.warn('Raw text:', text);
                aiReply = text || 'ไม่ได้รับข้อมูลจาก AI';
            }
        }

    } catch (err) {
        this.logger.error('Error calling n8n:', err);
        aiReply = 'AI error';
    }

    // 🔥 4. Save AI message
    await this.prisma.chatMessage.create({
        data: {
            sessionId,
            role: 'assistant',
            content: aiReply,
        },
    });

    // 5. Update session timestamp
    await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
    });

    // 6. Update title if first message
    if (createMessageDto.role === 'user' && session.title === 'New Chat') {
        const firstFewWords = createMessageDto.content.split(' ').slice(0, 5).join(' ');
        await this.prisma.chatSession.update({
            where: { id: sessionId },
            data: { title: firstFewWords || 'New Chat' }
        });
    }

    // 🔥 7. Return ทั้ง user + AI
    return {
        userMessage,
        aiReply,
    };
}

    async updateSessionTitle(id: string, title: string) {
        const session = await this.prisma.chatSession.findUnique({ where: { id } });
        if (!session) {
            throw new NotFoundException(`Chat session with ID ${id} not found`);
        }
        return this.prisma.chatSession.update({
            where: { id },
            data: { title },
        });
    }

    async deleteSession(id: string) {
        return this.prisma.chatSession.delete({
            where: { id },
        });
    }
}
