import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WalletsModule } from './wallets/wallets.module';
import { EscrowModule } from './escrow/escrow.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
    imports: [PrismaModule, AuthModule, WalletsModule, EscrowModule, JobsModule],
})
export class AppModule { }
