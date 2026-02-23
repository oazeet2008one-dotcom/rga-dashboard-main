export type EntitlementKey =
  | 'EXPORT_PDF'
  | 'EXPORT_CSV'
  | 'ALERTS'
  | 'AI_SUMMARY'
  | 'MULTI_USER'
  | 'INTEGRATIONS';

export interface Entitlements {
  plan: 'BASIC' | 'STANDARD' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'EXPIRED';
  endsAt?: string;
  maxIntegrations: number;
  enabled: Record<EntitlementKey, boolean>;
}
