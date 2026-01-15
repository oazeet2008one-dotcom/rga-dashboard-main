export type PlatformKey = 'facebook' | 'googleads' | 'googleanalytics' | 'line' | 'tiktok' | 'shopee';

export interface PlatformMeta {
  key: PlatformKey;
  label: string;
  badgeClassName: string;
}

export const PLATFORM_META: Record<PlatformKey, PlatformMeta> = {
  facebook: {
    key: 'facebook',
    label: 'Facebook',
    badgeClassName: 'bg-blue-100 text-blue-800',
  },
  googleads: {
    key: 'googleads',
    label: 'Google Ads',
    badgeClassName: 'bg-green-100 text-green-800',
  },
  googleanalytics: {
    key: 'googleanalytics',
    label: 'Google Analytics',
    badgeClassName: 'bg-orange-100 text-orange-800',
  },
  line: {
    key: 'line',
    label: 'LINE',
    badgeClassName: 'bg-green-100 text-green-800',
  },
  tiktok: {
    key: 'tiktok',
    label: 'TikTok',
    badgeClassName: 'bg-black text-white',
  },
  shopee: {
    key: 'shopee',
    label: 'Shopee',
    badgeClassName: 'bg-orange-100 text-orange-800',
  },
};

export const PLATFORM_OPTIONS: Array<{ value: PlatformKey; label: string }> = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'googleads', label: 'Google Ads' },
  { value: 'line', label: 'LINE' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'shopee', label: 'Shopee' },
];

export const getPlatformMeta = (platform: string): PlatformMeta | null => {
  const key = platform?.toLowerCase() as PlatformKey;
  return (PLATFORM_META as Partial<Record<PlatformKey, PlatformMeta>>)[key] ?? null;
};

export const getPlatformLabel = (platform: string): string => {
  return getPlatformMeta(platform)?.label ?? platform;
};

export const getPlatformBadgeClassName = (platform: string): string => {
  return getPlatformMeta(platform)?.badgeClassName ?? 'bg-gray-100 text-gray-800';
};
