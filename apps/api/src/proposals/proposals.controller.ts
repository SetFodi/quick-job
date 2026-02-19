import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProposalsController {
    constructor(private readonly proposalsService: ProposalsService) { }

    /** Worker submits a bid on a job */
    @Post('jobs/:jobId/proposals')
    async create(
        @Request() req: { user: { userId: string } },
        @Param('jobId') jobId: string,
        @Body() dto: CreateProposalDto,
    ) {
        return this.proposalsService.createProposal(req.user.userId, jobId, dto);
    }

    /** Client views all proposals for their job */
    @Get('jobs/:jobId/proposals')
    async findByJob(
        @Request() req: { user: { userId: string } },
        @Param('jobId') jobId: string,
    ) {
        return this.proposalsService.findByJob(jobId, req.user.userId);
    }

    /** Worker views their own proposals */
    @Get('my-proposals')
    async findMine(@Request() req: { user: { userId: string } }) {
        return this.proposalsService.findMyProposals(req.user.userId);
    }

    /** Client accepts a proposal → assigns worker, rejects others */
    @Patch('proposals/:id/accept')
    async accept(
        @Request() req: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.proposalsService.acceptProposal(id, req.user.userId);
    }

    /** Client rejects a proposal */
    @Patch('proposals/:id/reject')
    async reject(
        @Request() req: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.proposalsService.rejectProposal(id, req.user.userId);
    }
}
