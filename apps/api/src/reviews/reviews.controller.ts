import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post(':jobId')
    async submit(
        @Request() req: { user: { userId: string } },
        @Param('jobId') jobId: string,
        @Body() body: { rating: number; comment?: string },
    ) {
        return this.reviewsService.submitReview(jobId, req.user.userId, body.rating, body.comment);
    }

    @Get('job/:jobId')
    async getForJob(@Param('jobId') jobId: string) {
        return this.reviewsService.getForJob(jobId);
    }

    @Get('user/:userId')
    async getForUser(@Param('userId') userId: string) {
        return this.reviewsService.getForUser(userId);
    }

    @Get('check/:jobId')
    async hasReviewed(
        @Request() req: { user: { userId: string } },
        @Param('jobId') jobId: string,
    ) {
        return { hasReviewed: await this.reviewsService.hasReviewed(jobId, req.user.userId) };
    }
}
