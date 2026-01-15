import { Integration } from '@prisma/client';

import * as googleAdsSync from './googleAds';
import * as shopeeSync from './shopee';
import * as lazadaSync from './lazada';
import * as facebookSync from './facebook';
import * as ga4Sync from './ga4';
import * as tiktokSync from './tiktok.service';
import * as lineAdsSync from './lineAds.service';
import * as searchConsoleSync from './googleSearchConsole.service';

import * as mockFacebookSync from './mockFacebook';
import * as mockGa4Sync from './mockGa4';
import * as mockLineSync from './mockLine';
import * as mockShopeeSync from './mockShopee';
import * as mockTiktokSync from './mockTiktok';
import * as mockGoogleAdsSync from './mockGoogleAds';
import * as mockLazadaSync from './mockLazada';
import * as mockGoogleSearchConsoleSync from './mockGoogleSearchConsole';

export type SyncMode = 'real' | 'mock';

const parseJson = <T = any>(value: any, fallback: T): T => {
  try {
    if (!value) return fallback;
    return typeof value === 'string' ? JSON.parse(value) : (value as T);
  } catch {
    return fallback;
  }
};

export const normalizeProviderKey = (raw: string): string => {
  const key = (raw || '').trim().toLowerCase();
  if (key === 'googleads') return 'google_ads';
  if (key === 'google_ads') return 'google_ads';
  if (key === 'lineads') return 'line_ads';
  if (key === 'line') return 'line_ads';
  if (key === 'line_ads') return 'line_ads';
  if (key === 'gsc') return 'google_search_console';
  if (key === 'searchconsole') return 'google_search_console';
  return key;
};

const hasAnyCredential = (creds: any): boolean => {
  if (!creds) return false;
  if (typeof creds !== 'object') return Boolean(String(creds).trim());
  return Object.keys(creds).some((k) => {
    const v = (creds as any)[k];
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return true;
  });
};

export const shouldUseMock = (integration: Pick<Integration, 'provider' | 'config' | 'credentials'>): boolean => {
  const config = parseJson<any>((integration as any).config, {});
  if (config?.mockMode === true) return true;
  if (process.env.INGESTION_FORCE_MOCK === 'true') return true;

  const creds = parseJson<any>((integration as any).credentials, {});
  return !hasAnyCredential(creds);
};

const realSyncMap: Record<string, (integration: Integration) => Promise<any>> = {
  google_ads: googleAdsSync.sync,
  facebook: facebookSync.sync,
  ga4: ga4Sync.sync,
  shopee: shopeeSync.sync,
  lazada: lazadaSync.sync,
  tiktok: tiktokSync.sync,
  line_ads: lineAdsSync.sync,
  google_search_console: searchConsoleSync.sync,
};

const mockSyncMap: Record<string, (integration: Integration) => Promise<any>> = {
  google_ads: mockGoogleAdsSync.sync,
  facebook: mockFacebookSync.sync,
  ga4: mockGa4Sync.sync,
  shopee: mockShopeeSync.sync,
  lazada: mockLazadaSync.sync,
  tiktok: mockTiktokSync.sync,
  line_ads: mockLineSync.sync,
  google_search_console: mockGoogleSearchConsoleSync.sync,
};

export const getSyncHandler = (providerRaw: string, mode: SyncMode) => {
  const provider = normalizeProviderKey(providerRaw);
  const map = mode === 'mock' ? mockSyncMap : realSyncMap;
  return {
    provider,
    handler: map[provider] || null,
  };
};

export const syncIntegrationWithFallback = async (
  integration: Integration,
  options?: { forceMode?: SyncMode },
): Promise<{ provider: string; mode: SyncMode; result: any }> => {
  const provider = normalizeProviderKey(integration.provider);

  const mode: SyncMode = options?.forceMode
    ? options.forceMode
    : shouldUseMock(integration)
      ? 'mock'
      : 'real';

  const primary = getSyncHandler(provider, mode);
  if (!primary.handler) {
    const fallbackMode: SyncMode = mode === 'mock' ? 'real' : 'mock';
    const fallback = getSyncHandler(provider, fallbackMode);
    if (!fallback.handler) {
      throw new Error(`No sync handler found for provider: ${provider}`);
    }
    const result = await fallback.handler(integration);
    return { provider, mode: fallbackMode, result };
  }

  const result = await primary.handler(integration);
  return { provider, mode, result };
};

export const listKnownProviders = (): string[] => {
  const keys = new Set<string>([...Object.keys(realSyncMap), ...Object.keys(mockSyncMap)]);
  return Array.from(keys);
};
