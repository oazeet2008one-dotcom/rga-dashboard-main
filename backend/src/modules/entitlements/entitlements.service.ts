import { Injectable } from '@nestjs/common';
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import type { Entitlements } from './entitlements.types';

@Injectable()
export class EntitlementsService {
  buildEntitlements(params: {
    plan: SubscriptionPlan | null | undefined;
    status: SubscriptionStatus | null | undefined;
    endsAt: Date | null | undefined;
  }): Entitlements {
    const plan = params.plan ?? 'BASIC';
    const status = params.status ?? 'ACTIVE';

    if (plan === 'BASIC') {
      return {
        plan,
        status,
        endsAt: params.endsAt?.toISOString(),
        maxIntegrations: 2,
        enabled: {
          INTEGRATIONS: true,
          EXPORT_PDF: true,
          EXPORT_CSV: false,
          ALERTS: false,
          AI_SUMMARY: false,
          MULTI_USER: false,
        },
      };
    }

    if (plan === 'STANDARD') {
      return {
        plan,
        status,
        endsAt: params.endsAt?.toISOString(),
        maxIntegrations: 5,
        enabled: {
          INTEGRATIONS: true,
          EXPORT_PDF: true,
          EXPORT_CSV: true,
          ALERTS: true,
          AI_SUMMARY: true,
          MULTI_USER: true,
        },
      };
    }

    return {
      plan,
      status,
      endsAt: params.endsAt?.toISOString(),
      maxIntegrations: Number.POSITIVE_INFINITY,
      enabled: {
        INTEGRATIONS: true,
        EXPORT_PDF: true,
        EXPORT_CSV: true,
        ALERTS: true,
        AI_SUMMARY: true,
        MULTI_USER: true,
      },
    };
  }
}
