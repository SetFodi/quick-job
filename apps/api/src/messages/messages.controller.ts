import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Get()
    async getConversations(@Request() req: { user: { userId: string } }) {
        return this.messagesService.getConversations(req.user.userId);
    }

    @Get(':jobId')
    async getMessages(
        @Request() req: { user: { userId: string } },
        @Param('jobId') jobId: string,
    ) {
        return this.messagesService.getMessages(jobId, req.user.userId);
    }

    @Post(':jobId')
    async sendMessage(
        @Request() req: { user: { userId: string } },
        @Param('jobId') jobId: string,
        @Body('text') text: string,
    ) {
        return this.messagesService.sendMessage(jobId, req.user.userId, text);
    }
}
