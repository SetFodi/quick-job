import { Injectable, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
    constructor(private readonly prisma: PrismaService) { }

    async submitReview(jobId: string, reviewerId: string, rating: number, comment?: string) {
        if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be 1-5');

        const job = await this.prisma.job.findUniqueOrThrow({ where: { id: jobId } });
        if (job.status !== 'COMPLETED') throw new BadRequestException('Can only review completed jobs');

        const isClient = job.clientId === reviewerId;
        const isWorker = job.workerId === reviewerId;
        if (!isClient && !isWorker) throw new ForbiddenException('Not a participant');

        const revieweeId = isClient ? job.workerId! : job.clientId;

        const existing = await this.prisma.review.findUnique({
            where: { jobId_reviewerId: { jobId, reviewerId } },
        });
        if (existing) throw new ConflictException('Already reviewed');

        return this.prisma.review.create({
            data: { jobId, reviewerId, revieweeId, rating, comment: comment || null },
            include: { reviewer: { select: { fullName: true } } },
        });
    }

    async getForJob(jobId: string) {
        return this.prisma.review.findMany({
            where: { jobId },
            include: {
                reviewer: { select: { fullName: true, role: true } },
                reviewee: { select: { fullName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getForUser(userId: string) {
        const reviews = await this.prisma.review.findMany({
            where: { revieweeId: userId },
            include: {
                reviewer: { select: { fullName: true, role: true } },
                job: { select: { title: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        const avg = await this.prisma.review.aggregate({
            where: { revieweeId: userId },
            _avg: { rating: true },
            _count: { id: true },
        });

        return {
            averageRating: avg._avg.rating ? Math.round(avg._avg.rating * 10) / 10 : null,
            totalReviews: avg._count.id,
            reviews,
        };
    }

    async hasReviewed(jobId: string, reviewerId: string): Promise<boolean> {
        const r = await this.prisma.review.findUnique({
            where: { jobId_reviewerId: { jobId, reviewerId } },
        });
        return !!r;
    }
}
