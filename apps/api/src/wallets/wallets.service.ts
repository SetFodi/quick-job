import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletsService {
    constructor(private readonly prisma: PrismaService) { }

    async getOrCreateWallet(userId: string) {
        return this.prisma.wallet.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
    }

    async getBalance(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        return {
            available: wallet.availableBalance,
            frozen: wallet.frozenBalance,
        };
    }

    /**
     * Get transaction history for the logged-in user.
     * Returns ledger entries ordered by most recent first.
     */
    async getTransactions(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        return this.prisma.transaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                amount: true,
                referenceNote: true,
                milestoneId: true,
                createdAt: true,
            },
        });
    }

    /**
     * Admin-only: Credit a user's available balance after verifying
     * an external bank transfer. Creates a DEPOSIT ledger entry.
     */
    async deposit(userId: string, amount: Decimal, referenceNote: string) {
        if (amount.lessThanOrEqualTo(0)) {
            throw new BadRequestException('Deposit amount must be positive');
        }

        return this.prisma.$transaction(
            async (tx) => {
                const wallet = await tx.wallet.upsert({
                    where: { userId },
                    update: {
                        availableBalance: { increment: amount },
                    },
                    create: {
                        userId,
                        availableBalance: amount,
                    },
                });

                await tx.transaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'DEPOSIT',
                        amount,
                        referenceNote,
                    },
                });

                return wallet;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
    }

    /**
     * Move funds from available → frozen. Used by EscrowService
     * when locking funds for a milestone.
     */
    async freezeFunds(
        tx: Prisma.TransactionClient,
        walletId: string,
        amount: Decimal,
        milestoneId: string,
    ) {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
        const available = new Prisma.Decimal(wallet.availableBalance.toString());

        if (available.lessThan(amount)) {
            throw new BadRequestException(
                `Insufficient available balance. Available: ${available}, Required: ${amount}`,
            );
        }

        await tx.wallet.update({
            where: { id: walletId },
            data: {
                availableBalance: { decrement: amount },
                frozenBalance: { increment: amount },
            },
        });

        await tx.transaction.create({
            data: {
                walletId,
                milestoneId,
                type: 'ESCROW_LOCK',
                amount,
                referenceNote: `Escrow lock for milestone ${milestoneId}`,
            },
        });
    }

    /**
     * 3-way fund release: client frozen → worker available (95%) + platform available (5%).
     * Double-entry: every debit has a matching credit. Money never vanishes.
     */
    async releaseFunds(
        tx: Prisma.TransactionClient,
        clientWalletId: string,
        workerWalletId: string,
        platformWalletId: string,
        amount: Decimal,
        feeAmount: Decimal,
        workerAmount: Decimal,
        milestoneId: string,
    ) {
        // 1. Debit: decrement client frozen balance (full amount leaves escrow)
        await tx.wallet.update({
            where: { id: clientWalletId },
            data: { frozenBalance: { decrement: amount } },
        });

        // 2. Credit: worker receives 95%
        await tx.wallet.update({
            where: { id: workerWalletId },
            data: { availableBalance: { increment: workerAmount } },
        });

        // 3. Credit: platform receives 5% commission
        await tx.wallet.update({
            where: { id: platformWalletId },
            data: { availableBalance: { increment: feeAmount } },
        });

        // Ledger: RELEASE on client wallet (full amount)
        await tx.transaction.create({
            data: {
                walletId: clientWalletId,
                milestoneId,
                type: 'RELEASE',
                amount,
                referenceNote: `Release for milestone ${milestoneId}`,
            },
        });

        // Ledger: PLATFORM_FEE on platform wallet (5% credit)
        await tx.transaction.create({
            data: {
                walletId: platformWalletId,
                milestoneId,
                type: 'PLATFORM_FEE',
                amount: feeAmount,
                referenceNote: `5% commission on milestone ${milestoneId}`,
            },
        });
    }

    /**
     * Refund frozen funds back to client available_balance.
     * Used when admin resolves a dispute in client's favour.
     */
    async refundFunds(
        tx: Prisma.TransactionClient,
        walletId: string,
        amount: Decimal,
        milestoneId: string,
    ) {
        await tx.wallet.update({
            where: { id: walletId },
            data: {
                frozenBalance: { decrement: amount },
                availableBalance: { increment: amount },
            },
        });

        await tx.transaction.create({
            data: {
                walletId,
                milestoneId,
                type: 'REFUND',
                amount,
                referenceNote: `Refund for disputed milestone ${milestoneId}`,
            },
        });
    }
}

type Decimal = Prisma.Decimal;
