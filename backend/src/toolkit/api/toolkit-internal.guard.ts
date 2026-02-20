import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ToolkitInternalGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<{
            headers?: Record<string, string | string[] | undefined>;
        }>();

        if (process.env.NODE_ENV === 'production') {
            throw new ForbiddenException('Toolkit internal API is disabled in production');
        }

        if (process.env.TOOLKIT_INTERNAL_API_ENABLED !== 'true') {
            throw new ForbiddenException('Toolkit internal API is disabled');
        }

        const expectedKey = process.env.TOOLKIT_INTERNAL_API_KEY;
        if (!expectedKey) {
            throw new ForbiddenException('TOOLKIT_INTERNAL_API_KEY is not configured');
        }

        const headerValue = request.headers?.['x-toolkit-internal-key'];
        const providedKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;

        if (!providedKey || providedKey !== expectedKey) {
            throw new UnauthorizedException('Invalid toolkit internal API key');
        }

        return true;
    }
}
