import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletsModule } from './wallets/wallets.module';
import { EscrowModule } from './escrow/escrow.module';

@Module({
    imports: [PrismaModule, WalletsModule, EscrowModule],
})
export class AppModule { }
