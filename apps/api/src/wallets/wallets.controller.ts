import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallets')
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('balance')
    async getBalance(@Request() req: { user: { userId: string } }) {
        return this.walletsService.getBalance(req.user.userId);
    }

    /** Admin-only — will get @Roles('ADMIN') guard later */
    @Post(':userId/deposit')
    async deposit(
        @Param('userId') userId: string,
        @Body() body: { amount: string; referenceNote: string },
    ) {
        const amount = new Prisma.Decimal(body.amount);
        return this.walletsService.deposit(userId, amount, body.referenceNote);
    }
}
