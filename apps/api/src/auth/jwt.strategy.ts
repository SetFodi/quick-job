import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

interface SupabaseJwtPayload {
    sub: string;
    email: string;
    role: string;
    aud: string;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY;
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;

        if (!supabaseUrl && !jwtSecret) {
            throw new Error(
                'Either SUPABASE_URL (for JWKS/ES256) or SUPABASE_JWT_SECRET (for HMAC) must be set',
            );
        }

        const opts: StrategyOptionsWithoutRequest = supabaseUrl
            ? {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKeyProvider: passportJwtSecret({
                    jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
                    cache: true,
                    rateLimit: true,
                    jwksRequestsPerMinute: 5,
                    requestHeaders: { apikey: anonKey || '' },
                }),
                ignoreExpiration: false,
                algorithms: ['ES256', 'HS256'],
            }
            : {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: jwtSecret!,
                ignoreExpiration: false,
                algorithms: ['HS256'],
            };

        super(opts);
    }

    validate(payload: SupabaseJwtPayload) {
        if (payload.aud !== 'authenticated') {
            throw new UnauthorizedException('Invalid token audience');
        }

        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
