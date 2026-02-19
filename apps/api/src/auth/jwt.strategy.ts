import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

interface SupabaseJwtPayload {
    sub: string;
    email: string;
    role: string;
    aud: string;
    iss: string;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
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

    validate(payload: SupabaseJwtPayload) {
        if (payload.aud !== 'authenticated') {
            throw new UnauthorizedException('Invalid token audience');
        }

        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role || (payload as any).user_metadata?.role,
        };
    }
}
