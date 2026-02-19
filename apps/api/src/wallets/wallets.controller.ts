import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnlyGuard } from '../auth/admin-only.guard';
import { AdminOnly } from '../auth/admin-only.decorator';

@Controller('wallets')
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('balance')
    async getBalance(@Request() req: { user: { userId: string } }) {
        return this.walletsService.getBalance(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('transactions')
    async getTransactions(@Request() req: { user: { userId: string } }) {
        return this.walletsService.getTransactions(req.user.userId);
    }

    @AdminOnly()
    @UseGuards(JwtAuthGuard, AdminOnlyGuard)
    @Post(':userId/deposit')
    async deposit(
        @Param('userId') userId: string,
        @Body() body: { amount: string; referenceNote: string },
    ) {
        const amount = new Prisma.Decimal(body.amount);
        return this.walletsService.deposit(userId, amount, body.referenceNote);
    }
}
