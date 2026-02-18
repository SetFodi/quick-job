import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface SupabaseJwtPayload {
    sub: string;
    email: string;
    role: string;
    aud: string;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
    constructor() {
        const secret = process.env.SUPABASE_JWT_SECRET;
        if (!secret) {
            throw new Error('SUPABASE_JWT_SECRET env variable is required');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: secret,
            ignoreExpiration: false,
        });
    }

    validate(payload: SupabaseJwtPayload) {
        if (payload.aud !== 'authenticated') {
            throw new UnauthorizedException('Invalid token audience');
        }

        // Attached to req.user by Passport
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
