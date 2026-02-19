import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminOnlyGuard } from './admin-only.guard';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
    providers: [SupabaseStrategy, JwtAuthGuard, AdminOnlyGuard],
    exports: [JwtAuthGuard, AdminOnlyGuard],
})
export class AuthModule { }
