import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(
        @Request() req: { user: { userId: string } },
        @Body() dto: CreateJobDto,
    ) {
        return this.jobsService.createJob(req.user.userId, dto);
    }

    @Get()
    async findAll() {
        return this.jobsService.findAllOpen();
    }

    @UseGuards(JwtAuthGuard)
    @Get('my')
    async findMine(@Request() req: { user: { userId: string } }) {
        return this.jobsService.findMyJobs(req.user.userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.jobsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(
        @Request() req: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.jobsService.deleteJob(req.user.userId, id);
    }
}
