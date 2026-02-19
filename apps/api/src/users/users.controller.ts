import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnlyGuard } from '../auth/admin-only.guard';
import { AdminOnly } from '../auth/admin-only.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly prisma: PrismaService) { }

    @AdminOnly()
    @UseGuards(JwtAuthGuard, AdminOnlyGuard)
    @Get()
    async getAll() {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true,
                wallet: {
                    select: {
                        availableBalance: true,
                        frozenBalance: true,
                    },
                },
            },
        });

        return users.map((user) => ({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            createdAt: user.createdAt,
            wallet: {
                available: user.wallet?.availableBalance?.toString() ?? '0',
                frozen: user.wallet?.frozenBalance?.toString() ?? '0',
            },
        }));
    }

    @Get('me')
    async getMe(@Request() req: { user: { userId: string } }) {
        const userId = req.user.userId;

        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });

        const [jobsPosted, jobsWorked, jobsCompleted, proposalsSent] = await Promise.all([
            this.prisma.job.count({ where: { clientId: userId } }),
            this.prisma.job.count({ where: { workerId: userId } }),
            this.prisma.job.count({ where: { OR: [{ clientId: userId }, { workerId: userId }], status: 'COMPLETED' } }),
            this.prisma.proposal.count({ where: { workerId: userId } }),
        ]);

        const totalJobs = jobsPosted + jobsWorked;
        const successRate = totalJobs > 0 ? Math.round((jobsCompleted / totalJobs) * 100) : 0;

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            createdAt: user.createdAt,
            stats: {
                jobsPosted,
                jobsWorked,
                jobsCompleted,
                proposalsSent,
                successRate,
            },
        };
    }
}
