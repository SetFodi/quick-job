import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WalletsModule } from './wallets/wallets.module';
import { EscrowModule } from './escrow/escrow.module';
import { JobsModule } from './jobs/jobs.module';
import { ProposalsModule } from './proposals/proposals.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        WalletsModule,
        EscrowModule,
        JobsModule,
        ProposalsModule,
        UsersModule,
        MessagesModule,
        ReviewsModule,
    ],
})
export class AppModule { }
