import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface SupabaseJwtPayload {
    sub: string;
    email: string;
    role: string;
    aud: string;
    iss: string;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        const supabaseUrl = configService.get<string>('SUPABASE_URL')?.replace(/\/$/, '');

        if (!supabaseUrl) {
            throw new Error('SUPABASE_URL is not defined in environment');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
            }),
            algorithms: ['ES256'],
            issuer: `${supabaseUrl}/auth/v1`,
            audience: 'authenticated',
        });
    }

    async validate(payload: SupabaseJwtPayload) {
        if (payload.aud !== 'authenticated') {
            throw new UnauthorizedException('Invalid token audience');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { role: true },
        });

        const metadataRole = (payload as SupabaseJwtPayload & {
            user_metadata?: { role?: string };
        }).user_metadata?.role;

        const allowedRoles: UserRole[] = ['CLIENT', 'WORKER', 'ADMIN'];
        const roleFromMetadata = allowedRoles.includes(metadataRole as UserRole)
            ? (metadataRole as UserRole)
            : null;
        const resolvedRole = user?.role ?? roleFromMetadata;

        if (!resolvedRole) {
            throw new UnauthorizedException('User role is not available');
        }

        return {
            userId: payload.sub,
            email: payload.email,
            role: resolvedRole,
        };
    }
}
