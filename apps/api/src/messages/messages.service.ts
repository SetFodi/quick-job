import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    async getConversations(userId: string) {
        const jobs = await this.prisma.job.findMany({
            where: {
                OR: [
                    { clientId: userId },
                    { workerId: userId },
                ],
                workerId: { not: null },
            },
            select: {
                id: true,
                title: true,
                status: true,
                clientId: true,
                workerId: true,
                client: { select: { fullName: true } },
                worker: { select: { fullName: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        text: true,
                        createdAt: true,
                        senderId: true,
                    },
                },
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return jobs
            .filter((j) => j._count.messages > 0 || j.clientId === userId || j.workerId === userId)
            .map((j) => ({
                jobId: j.id,
                jobTitle: j.title,
                jobStatus: j.status,
                clientName: j.client.fullName,
                workerName: j.worker?.fullName ?? null,
                otherPartyName: userId === j.clientId
                    ? j.worker?.fullName ?? ''
                    : j.client.fullName,
                lastMessage: j.messages[0] ?? null,
                totalMessages: j._count.messages,
            }));
    }

    async getMessages(jobId: string, userId: string) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            select: { clientId: true, workerId: true },
        });
        if (!job) throw new NotFoundException('Job not found');
        if (job.clientId !== userId && job.workerId !== userId) {
            throw new ForbiddenException('You are not a participant of this job');
        }

        return this.prisma.message.findMany({
            where: { jobId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { fullName: true } } },
        });
    }

    async sendMessage(jobId: string, senderId: string, text: string) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            select: { clientId: true, workerId: true },
        });
        if (!job) throw new NotFoundException('Job not found');
        if (job.clientId !== senderId && job.workerId !== senderId) {
            throw new ForbiddenException('You are not a participant of this job');
        }

        return this.prisma.message.create({
            data: { jobId, senderId, text },
            include: { sender: { select: { fullName: true } } },
        });
    }
}
