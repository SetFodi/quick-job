import { Module } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
    imports: [WalletsModule],
    providers: [EscrowService],
    controllers: [EscrowController],
})
export class EscrowModule { }
