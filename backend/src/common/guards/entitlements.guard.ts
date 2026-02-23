import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ENTITLEMENTS_KEY } from '../decorators/require-entitlements.decorator';
import type { EntitlementKey } from '../../modules/entitlements/entitlements.types';
import { EntitlementsService } from '../../modules/entitlements/entitlements.service';

@Injectable()
export class EntitlementsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementsService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<EntitlementKey[]>(
      REQUIRE_ENTITLEMENTS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenant = user?.tenant;

    const resolved = this.entitlements.buildEntitlements({
      plan: tenant?.subscriptionPlan,
      status: tenant?.subscriptionStatus,
      endsAt: tenant?.subscriptionEndsAt,
    });

    const missing = required.filter((key) => !resolved.enabled[key]);
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing entitlements: ${missing.join(', ')}`);
    }

    return true;
  }
}
