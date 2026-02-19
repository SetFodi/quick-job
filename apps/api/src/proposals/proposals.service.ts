import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Injectable()
export class ProposalsService {
    constructor(private readonly prisma: PrismaService) { }

    async createProposal(
        workerId: string,
        jobId: string,
        dto: CreateProposalDto,
    ) {
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });

        if (!job) throw new NotFoundException(`Job ${jobId} not found`);
        if (job.status !== 'OPEN')
            throw new BadRequestException('Job is no longer open for proposals');
        if (job.clientId === workerId)
            throw new ForbiddenException('You cannot bid on your own job');

        // One proposal per worker per job (enforced by @@unique in schema)
        try {
            return await this.prisma.proposal.create({
                data: {
                    jobId,
                    workerId,
                    proposedAmount: new Prisma.Decimal(dto.proposedAmount),
                    coverLetter: dto.coverLetter ?? '',
                    status: 'PENDING',
                },
                include: { job: { select: { title: true } } },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('You already submitted a proposal for this job');
            }
            throw error;
        }
    }

    /** Only the job owner (client) can see proposals for their job */
    async findByJob(jobId: string, requesterId: string) {
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });

        if (!job) throw new NotFoundException(`Job ${jobId} not found`);
        if (job.clientId !== requesterId)
            throw new ForbiddenException('Only the job owner can view proposals');

        return this.prisma.proposal.findMany({
            where: { jobId },
            orderBy: { createdAt: 'desc' },
            include: {
                worker: { select: { fullName: true, email: true } },
            },
        });
    }

    /** Worker sees their own proposals across all jobs */
    async findMyProposals(workerId: string) {
        return this.prisma.proposal.findMany({
            where: { workerId },
            orderBy: { createdAt: 'desc' },
            include: {
                job: { select: { id: true, title: true, category: true, status: true } },
            },
        });
    }

    async acceptProposal(proposalId: string, requesterId: string) {
        return this.prisma.$transaction(async (tx) => {
            const proposal = await tx.proposal.findUnique({
                where: { id: proposalId },
                include: { job: true },
            });

            if (!proposal) throw new NotFoundException('Proposal not found');
            if (proposal.job.clientId !== requesterId)
                throw new ForbiddenException('Only the job owner can accept proposals');
            if (proposal.job.status !== 'OPEN')
                throw new BadRequestException('Job is no longer open');
            if (proposal.status !== 'PENDING')
                throw new BadRequestException('Proposal is not pending');

            // 1. Accept this proposal
            const accepted = await tx.proposal.update({
                where: { id: proposalId },
                data: { status: 'ACCEPTED' },
            });

            // 2. Assign worker to job
            await tx.job.update({
                where: { id: proposal.jobId },
                data: {
                    workerId: proposal.workerId,
                    status: 'ASSIGNED',
                },
            });

            // 3. Reject all other pending proposals for this job
            await tx.proposal.updateMany({
                where: {
                    jobId: proposal.jobId,
                    id: { not: proposalId },
                    status: 'PENDING',
                },
                data: { status: 'REJECTED' },
            });

            return accepted;
        });
    }

    async rejectProposal(proposalId: string, requesterId: string) {
        const proposal = await this.prisma.proposal.findUnique({
            where: { id: proposalId },
            include: { job: { select: { clientId: true } } },
        });

        if (!proposal) throw new NotFoundException('Proposal not found');
        if (proposal.job.clientId !== requesterId)
            throw new ForbiddenException('Only the job owner can reject proposals');
        if (proposal.status !== 'PENDING')
            throw new BadRequestException('Proposal is not pending');

        return this.prisma.proposal.update({
            where: { id: proposalId },
            data: { status: 'REJECTED' },
        });
    }
}
