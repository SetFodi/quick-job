import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('escrow')
export class EscrowController {
    constructor(private readonly escrowService: EscrowService) { }

    /** Client funds a milestone — userId extracted from JWT */
    @UseGuards(JwtAuthGuard)
    @Post('milestones/:milestoneId/lock')
    async lockFunds(
        @Request() req: { user: { userId: string } },
        @Param('milestoneId') milestoneId: string,
    ) {
        return this.escrowService.lockFundsForMilestone(req.user.userId, milestoneId);
    }

    /** Worker submits completed work for review */
    @UseGuards(JwtAuthGuard)
    @Post('milestones/:milestoneId/submit')
    async submitWork(
        @Request() req: { user: { userId: string } },
        @Param('milestoneId') milestoneId: string,
    ) {
        return this.escrowService.submitMilestone(req.user.userId, milestoneId);
    }

    /** Client approves work — releases funds to worker (minus 5% fee) */
    @UseGuards(JwtAuthGuard)
    @Post('milestones/:milestoneId/release')
    async release(
        @Request() req: { user: { userId: string } },
        @Param('milestoneId') milestoneId: string,
    ) {
        return this.escrowService.releaseMilestone(req.user.userId, milestoneId);
    }

    /** Either party disputes a milestone */
    @UseGuards(JwtAuthGuard)
    @Post('milestones/:milestoneId/dispute')
    async dispute(@Param('milestoneId') milestoneId: string) {
        return this.escrowService.disputeMilestone(milestoneId);
    }

    /** Admin resolves dispute: refund to client */
    @Post('milestones/:milestoneId/resolve-refund')
    async resolveRefund(@Param('milestoneId') milestoneId: string) {
        return this.escrowService.resolveDisputeRefund(milestoneId);
    }

    /** Admin resolves dispute: release to worker */
    @Post('milestones/:milestoneId/resolve-release')
    async resolveRelease(@Param('milestoneId') milestoneId: string) {
        return this.escrowService.resolveDisputeRelease(milestoneId);
    }
}
