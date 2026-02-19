import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
    constructor(private readonly prisma: PrismaService) { }

    async createJob(clientId: string, dto: CreateJobDto) {
        return this.prisma.$transaction(async (tx) => {
            const job = await tx.job.create({
                data: {
                    clientId,
                    title: dto.title,
                    category: dto.category,
                    description: dto.description,
                    totalBudget: new Prisma.Decimal(dto.totalBudget),
                    deadline: new Date(dto.deadline),
                    status: 'OPEN',
                    milestones: {
                        create: dto.milestones.map((m) => ({
                            title: m.title,
                            amount: new Prisma.Decimal(m.amount),
                            order: m.order,
                            status: 'PENDING',
                        })),
                    },
                },
                include: { milestones: { orderBy: { order: 'asc' } } },
            });

            return job;
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
            maxWait: 10000,
            timeout: 15000,
        });
    }

    async findAllOpen() {
        return this.prisma.job.findMany({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' },
            include: {
                milestones: { orderBy: { order: 'asc' } },
                client: { select: { fullName: true } },
            },
        });
    }

    async findMyJobs(userId: string) {
        return this.prisma.job.findMany({
            where: {
                OR: [{ clientId: userId }, { workerId: userId }],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                milestones: { orderBy: { order: 'asc' } },
                client: { select: { fullName: true } },
                worker: { select: { fullName: true } },
            },
        });
    }

    async findOne(id: string) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
                milestones: { orderBy: { order: 'asc' } },
                client: { select: { fullName: true } },
            },
        });

        if (!job) {
            throw new NotFoundException(`Job ${id} not found`);
        }

        return job;
    }

    async deleteJob(clientId: string, jobId: string) {
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });
        if (!job) throw new NotFoundException(`Job ${jobId} not found`);
        if (job.clientId !== clientId) throw new ForbiddenException('Only the client can delete this job');
        if (job.status !== 'OPEN') throw new BadRequestException('Can only delete OPEN jobs');

        await this.prisma.proposal.deleteMany({ where: { jobId } });
        await this.prisma.milestone.deleteMany({ where: { jobId } });
        await this.prisma.job.delete({ where: { id: jobId } });

        return { deleted: true };
    }
}
