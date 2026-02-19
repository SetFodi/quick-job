import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ONLY_KEY } from './admin-only.decorator';

type RequestWithUser = {
    user?: {
        role?: string;
    };
};

@Injectable()
export class AdminOnlyGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiresAdmin = this.reflector.getAllAndOverride<boolean>(
            ADMIN_ONLY_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiresAdmin) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RequestWithUser>();
        if (request.user?.role === 'ADMIN') {
            return true;
        }

        throw new ForbiddenException('Admin access required');
    }
}
