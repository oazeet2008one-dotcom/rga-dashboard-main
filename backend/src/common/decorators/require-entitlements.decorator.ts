import { SetMetadata } from '@nestjs/common';
import type { EntitlementKey } from '../../modules/entitlements/entitlements.types';

export const REQUIRE_ENTITLEMENTS_KEY = 'require_entitlements';

export const RequireEntitlements = (...entitlements: EntitlementKey[]) =>
  SetMetadata(REQUIRE_ENTITLEMENTS_KEY, entitlements);
