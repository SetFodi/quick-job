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
    user_metadata?: { role?: string };
}

const ALLOWED_ROLES: UserRole[] = ['CLIENT', 'WORKER', 'ADMIN'];
const roleCache = new Map<string, { role: UserRole; at: number }>();
const ROLE_CACHE_TTL = 300_000; // 5 minutes

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
                cacheMaxAge: 600_000,
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

        const metadataRole = payload.user_metadata?.role;
        if (metadataRole && ALLOWED_ROLES.includes(metadataRole as UserRole)) {
            return {
                userId: payload.sub,
                email: payload.email,
                role: metadataRole as UserRole,
            };
        }

        const cached = roleCache.get(payload.sub);
        if (cached && Date.now() - cached.at < ROLE_CACHE_TTL) {
            return {
                userId: payload.sub,
                email: payload.email,
                role: cached.role,
            };
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { role: true },
        });

        if (!user?.role) {
            throw new UnauthorizedException('User role is not available');
        }

        roleCache.set(payload.sub, { role: user.role, at: Date.now() });

        return {
            userId: payload.sub,
            email: payload.email,
            role: user.role,
        };
    }
}
