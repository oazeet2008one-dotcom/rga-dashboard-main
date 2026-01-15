import React from 'react';

export type RequiredPlatformConfig = {
  id: string;
  label: string;
  provider: string;
  icon: React.ReactNode;
  color: string;
  description: string;
};

type PlatformMeta = {
  id: string;
  label: string;
  provider: string;
  simpleIconsSlug: string;
  color: string;
  description: string;
};

const PLATFORM_META: PlatformMeta[] = [
  {
    id: 'googleads',
    label: 'Google Ads',
    provider: 'googleads',
    simpleIconsSlug: 'googleads',
    color: 'bg-red-500',
    description: 'Sync campaigns and conversion data from Google Ads.',
  },
  {
    id: 'googleanalytics',
    label: 'Google Analytics',
    provider: 'googleanalytics',
    simpleIconsSlug: 'googleanalytics',
    color: 'bg-orange-500',
    description: 'Track website traffic and user behavior analytics.',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    provider: 'facebook',
    simpleIconsSlug: 'facebook',
    color: 'bg-blue-600',
    description: 'Connect Meta Ads for real-time performance.',
  },
  {
    id: 'line',
    label: 'LINE OA',
    provider: 'line',
    simpleIconsSlug: 'line',
    color: 'bg-green-500',
    description: 'Pull CRM and messaging KPIs from LINE OA.',
  },
  {
    id: 'tiktok',
    label: 'TikTok Ads',
    provider: 'tiktok',
    simpleIconsSlug: 'tiktok',
    color: 'bg-zinc-900',
    description: 'Monitor short-form video campaigns from TikTok.',
  },
];

const buildRequiredPlatforms = (options: {
  iconClassName: string;
  includeProviders: string[];
}): RequiredPlatformConfig[] => {
  const { iconClassName, includeProviders } = options;
  return PLATFORM_META.filter((platform) => includeProviders.includes(platform.provider)).map((platform) => ({
    id: platform.id,
    label: platform.label,
    provider: platform.provider,
    icon: (
      <img
        src={`https://cdn.simpleicons.org/${platform.simpleIconsSlug}/FFFFFF`}
        className={iconClassName}
        alt={platform.label}
      />
    ),
    color: platform.color,
    description: platform.description,
  }));
};

export const REQUIRED_PLATFORMS_DASHBOARD: RequiredPlatformConfig[] = buildRequiredPlatforms({
  iconClassName: 'h-8 w-8',
  includeProviders: ['googleads', 'googleanalytics', 'facebook', 'line', 'tiktok'],
});

export const REQUIRED_PLATFORMS_CHECKLIST: RequiredPlatformConfig[] = buildRequiredPlatforms({
  iconClassName: 'h-6 w-6',
  includeProviders: ['googleads', 'facebook', 'line', 'tiktok'],
});
