import { Controller, Post, Param } from '@nestjs/common';
import { EscrowService } from './escrow.service';

@Controller('escrow')
export class EscrowController {
    constructor(private readonly escrowService: EscrowService) { }

    /** Client funds a milestone — locks funds in escrow */
    @Post('milestones/:milestoneId/lock/:clientId')
    async lockFunds(
        @Param('milestoneId') milestoneId: string,
        @Param('clientId') clientId: string,
    ) {
        return this.escrowService.lockFundsForMilestone(clientId, milestoneId);
    }

    /** Client approves work — releases funds to worker (minus 5% fee) */
    @Post('milestones/:milestoneId/release')
    async release(@Param('milestoneId') milestoneId: string) {
        return this.escrowService.releaseMilestone(milestoneId);
    }

    /** Either party disputes a milestone */
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
