import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Get(':userId/balance')
    async getBalance(@Param('userId') userId: string) {
        return this.walletsService.getBalance(userId);
    }

    /** Admin-only endpoint — add auth guard before production */
    @Post(':userId/deposit')
    async deposit(
        @Param('userId') userId: string,
        @Body() body: { amount: string; referenceNote: string },
    ) {
        const amount = new Prisma.Decimal(body.amount);
        return this.walletsService.deposit(userId, amount, body.referenceNote);
    }
}
