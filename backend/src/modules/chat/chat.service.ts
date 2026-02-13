
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(private prisma: PrismaService) { }

    async createSession(userId: string | null, createSessionDto: CreateChatSessionDto) {
        return this.prisma.chatSession.create({
            data: {
                userId: userId,
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

    async addMessage(sessionId: string, createMessageDto: CreateChatMessageDto) {
        // 1. Verify session exists
        const session = await this.prisma.chatSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
        }

        // 2. Create message
        const message = await this.prisma.chatMessage.create({
            data: {
                sessionId,
                role: createMessageDto.role,
                content: createMessageDto.content,
            },
        });

        // 3. Update session timestamp
        await this.prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
        });

        // Update title if it's the first user message and title is default
        if (createMessageDto.role === 'user' && session.title === 'New Chat') {
            const firstFewWords = createMessageDto.content.split(' ').slice(0, 5).join(' ');
            await this.prisma.chatSession.update({
                where: { id: sessionId },
                data: { title: firstFewWords || 'New Chat' }
            });
        }

        return message;
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
