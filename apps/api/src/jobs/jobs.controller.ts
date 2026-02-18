import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
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

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.jobsService.findOne(id);
    }
}
