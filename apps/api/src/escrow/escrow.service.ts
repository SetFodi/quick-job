import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PLATFORM_FEE_RATE } from '@quick-job/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class EscrowService {
    private readonly platformWalletId: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly walletsService: WalletsService,
    ) {
        const walletId = process.env.PLATFORM_WALLET_ID;
        if (!walletId) {
            throw new Error('PLATFORM_WALLET_ID env variable is required');
        }
        this.platformWalletId = walletId;
    }

    /**
     * Lock funds for a specific milestone.
     *
     * Flow:
     * 1. Verify the caller is the job's client
     * 2. Verify the milestone is in PENDING status
     * 3. Check available_balance >= milestone.amount
     * 4. Atomically: decrement available, increment frozen, log ESCROW_LOCK
     * 5. Update milestone status to FUNDED
     */
    async lockFundsForMilestone(clientId: string, milestoneId: string) {
        return this.prisma.$transaction(
            async (tx) => {
                const milestone = await tx.milestone.findUniqueOrThrow({
                    where: { id: milestoneId },
                    include: { job: true },
                });

                if (milestone.job.clientId !== clientId) {
                    throw new ForbiddenException('Only the job client can fund milestones');
                }

                if (milestone.status !== 'PENDING') {
                    throw new BadRequestException(
                        `Milestone must be PENDING to fund. Current status: ${milestone.status}`,
                    );
                }

                const clientWallet = await tx.wallet.findUniqueOrThrow({
                    where: { userId: clientId },
                });

                const amount = new Prisma.Decimal(milestone.amount.toString());

                await this.walletsService.freezeFunds(tx, clientWallet.id, amount, milestoneId);

                await tx.milestone.update({
                    where: { id: milestoneId },
                    data: { status: 'FUNDED' },
                });

                // Transition job to IN_PROGRESS if it was ASSIGNED
                if (milestone.job.status === 'ASSIGNED') {
                    await tx.job.update({
                        where: { id: milestone.jobId },
                        data: { status: 'IN_PROGRESS' },
                    });
                }

                return {
                    milestoneId,
                    amountLocked: amount.toString(),
                    status: 'FUNDED',
                    jobStatus: milestone.job.status === 'ASSIGNED' ? 'IN_PROGRESS' : milestone.job.status,
                };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
                timeout: 20000,
            },
        );
    }

    /**
     * Worker submits work for a funded milestone.
     *
     * Flow:
     * 1. Verify the caller is the job's assigned worker
     * 2. Verify the milestone is in FUNDED status
     * 3. Update milestone status to REVIEW
     * Job stays IN_PROGRESS (multi-milestone independence)
     */
    async submitMilestone(workerId: string, milestoneId: string) {
        const milestone = await this.prisma.milestone.findUniqueOrThrow({
            where: { id: milestoneId },
            include: { job: true },
        });

        if (milestone.job.workerId !== workerId) {
            throw new ForbiddenException('Only the assigned worker can submit work');
        }

        if (milestone.status !== 'FUNDED') {
            throw new BadRequestException(
                `Milestone must be FUNDED to submit. Current status: ${milestone.status}`,
            );
        }

        const updated = await this.prisma.milestone.update({
            where: { id: milestoneId },
            data: { status: 'REVIEW' },
        });

        return {
            milestoneId: updated.id,
            status: 'REVIEW',
            message: 'Work submitted for client review',
        };
    }

    /**
     * Release funds for a completed milestone.
     *
     * Flow:
     * 1. Verify the caller is the job's client
     * 2. Verify milestone is in REVIEW status
     * 3. Calculate: workerAmount = amount * 0.95, platformFee = amount * 0.05
     * 4. Atomically: move funds from client frozen → worker available, log transactions
     * 5. Update milestone to COMPLETED
     * 6. If all milestones completed → Job becomes COMPLETED
     */
    async releaseMilestone(clientId: string, milestoneId: string) {
        return this.prisma.$transaction(
            async (tx) => {
                const milestone = await tx.milestone.findUniqueOrThrow({
                    where: { id: milestoneId },
                    include: { job: true },
                });

                if (milestone.job.clientId !== clientId) {
                    throw new ForbiddenException('Only the job client can release funds');
                }

                if (milestone.status !== 'REVIEW') {
                    throw new BadRequestException(
                        `Milestone must be in REVIEW to release. Current: ${milestone.status}`,
                    );
                }

                if (!milestone.job.workerId) {
                    throw new BadRequestException('Job has no assigned worker');
                }

                const amount = new Prisma.Decimal(milestone.amount.toString());
                const feeAmount = amount.mul(PLATFORM_FEE_RATE);
                const workerAmount = amount.sub(feeAmount);

                const clientWallet = await tx.wallet.findUniqueOrThrow({
                    where: { userId: milestone.job.clientId },
                });

                const workerWallet = await tx.wallet.findUniqueOrThrow({
                    where: { userId: milestone.job.workerId },
                });

                await this.walletsService.releaseFunds(
                    tx,
                    clientWallet.id,
                    workerWallet.id,
                    this.platformWalletId,
                    amount,
                    feeAmount,
                    workerAmount,
                    milestoneId,
                );

                await tx.milestone.update({
                    where: { id: milestoneId },
                    data: { status: 'COMPLETED' },
                });

                // If all milestones are completed, mark job as completed
                const remainingMilestones = await tx.milestone.count({
                    where: {
                        jobId: milestone.jobId,
                        status: { not: 'COMPLETED' },
                    },
                });

                const jobCompleted = remainingMilestones === 0;

                if (jobCompleted) {
                    await tx.job.update({
                        where: { id: milestone.jobId },
                        data: { status: 'COMPLETED' },
                    });
                }

                return {
                    milestoneId,
                    released: amount.toString(),
                    platformFee: feeAmount.toString(),
                    workerReceived: workerAmount.toString(),
                    jobCompleted,
                };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
                timeout: 20000,
            },
        );
    }

    /**
     * Dispute a milestone. Funds remain frozen until admin resolves.
     */
    async disputeMilestone(milestoneId: string) {
        const milestone = await this.prisma.milestone.findUniqueOrThrow({
            where: { id: milestoneId },
        });

        if (!['FUNDED', 'IN_PROGRESS', 'REVIEW'].includes(milestone.status)) {
            throw new BadRequestException(
                `Cannot dispute milestone in ${milestone.status} status`,
            );
        }

        return this.prisma.milestone.update({
            where: { id: milestoneId },
            data: { status: 'DISPUTED' },
        });
    }

    /**
     * Admin resolves a dispute: refund to client.
     * Moves funds from frozen → client available.
     */
    async resolveDisputeRefund(milestoneId: string) {
        return this.prisma.$transaction(
            async (tx) => {
                const milestone = await tx.milestone.findUniqueOrThrow({
                    where: { id: milestoneId },
                    include: { job: true },
                });

                if (milestone.status !== 'DISPUTED') {
                    throw new BadRequestException('Milestone must be DISPUTED to resolve');
                }

                const clientWallet = await tx.wallet.findUniqueOrThrow({
                    where: { userId: milestone.job.clientId },
                });

                const amount = new Prisma.Decimal(milestone.amount.toString());

                await this.walletsService.refundFunds(tx, clientWallet.id, amount, milestoneId);

                await tx.milestone.update({
                    where: { id: milestoneId },
                    data: { status: 'PENDING' },
                });

                return { milestoneId, refunded: amount.toString(), status: 'PENDING' };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
                timeout: 20000,
            },
        );
    }

    /**
     * Admin resolves a dispute: release to worker.
     * Same as normal release but from DISPUTED status.
     */
    async resolveDisputeRelease(milestoneId: string) {
        return this.prisma.$transaction(
            async (tx) => {
                const milestone = await tx.milestone.findUniqueOrThrow({
                    where: { id: milestoneId },
                    include: { job: true },
                });

                if (milestone.status !== 'DISPUTED') {
                    throw new BadRequestException('Milestone must be DISPUTED to resolve');
                }

                if (!milestone.job.workerId) {
                    throw new BadRequestException('Job has no assigned worker');
                }

                const amount = new Prisma.Decimal(milestone.amount.toString());
                const feeAmount = amount.mul(PLATFORM_FEE_RATE);
                const workerAmount = amount.sub(feeAmount);

                const clientWallet = await tx.wallet.findUniqueOrThrow({
                    where: { userId: milestone.job.clientId },
                });

                const workerWallet = await tx.wallet.findUniqueOrThrow({
                    where: { userId: milestone.job.workerId },
                });

                await this.walletsService.releaseFunds(
                    tx,
                    clientWallet.id,
                    workerWallet.id,
                    this.platformWalletId,
                    amount,
                    feeAmount,
                    workerAmount,
                    milestoneId,
                );

                await tx.milestone.update({
                    where: { id: milestoneId },
                    data: { status: 'COMPLETED' },
                });

                return {
                    milestoneId,
                    released: amount.toString(),
                    platformFee: feeAmount.toString(),
                    workerReceived: workerAmount.toString(),
                };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
                timeout: 20000,
            },
        );
    }
}
