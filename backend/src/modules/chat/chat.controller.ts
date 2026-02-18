
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('chat')
@UseGuards(OptionalJwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('sessions')
    // @UseGuards(JwtAuthGuard) // Enable if strict auth required
    async createSession(@Body() createSessionDto: CreateChatSessionDto, @Request() req: any) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id || null; // Handle both auth and guest
        if (!tenantId || !userId) {
            return { message: 'Unauthorized' };
        }
        return this.chatService.createSession(tenantId, userId, createSessionDto);
    }

    @Get('sessions')
    async getSessions(@Query('userId') queryUserId: string, @Request() req: any) {
        // Allow passing userId via query for dev/testing if auth not fully set up
        const userId = req.user?.id || queryUserId || null;
        return this.chatService.getSessions(userId);
    }

    @Get('sessions/:id')
    async getSession(@Param('id') id: string) {
        return this.chatService.getSession(id);
    }

    @Patch('sessions/:id')
    async updateSessionTitle(@Param('id') id: string, @Body('title') title: string) {
        return this.chatService.updateSessionTitle(id, title);
    }

    @Delete('sessions/:id')
    async deleteSession(@Param('id') id: string) {
        return this.chatService.deleteSession(id);
    }

    @Post('messages')
    async addMessage(@Body() createMessageDto: CreateChatMessageDto, @Request() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return { message: 'Unauthorized' };
        }
        return this.chatService.addMessage(tenantId, createMessageDto.sessionId, createMessageDto);
    }
}
