import { useCallback, useMemo, useState } from 'react';
import { Integration } from '../../types/api';
import { getIntegrations, updateIntegration } from '../../services/api';
import { RequiredPlatformConfig } from './requiredPlatforms';

export type IntegrationChecklistAlert = {
  title: string;
  description: string;
  timestamp: string;
};

export type IntegrationChecklistStep = RequiredPlatformConfig & {
  status: 'connected' | 'disconnected';
  integration?: Integration;
};

type Options = {
  onLoadError?: (message: string) => void;
  onToggleError?: (message: string) => void;
  onMissingIntegration?: (message: string) => void;
};

export const useIntegrationChecklist = (requiredPlatforms: RequiredPlatformConfig[], options: Options = {}) => {
  const { onLoadError, onToggleError, onMissingIntegration } = options;
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [platformAlert, setPlatformAlert] = useState<IntegrationChecklistAlert | null>(null);

  const loadIntegrations = useCallback(async () => {
    try {
      setIntegrationLoading(true);
      const data = await getIntegrations();
      setIntegrations(data || []);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to load integration status from the API';
      if (onLoadError) {
        onLoadError(message);
      } else {
        throw err;
      }
    } finally {
      setIntegrationLoading(false);
    }
  }, [onLoadError]);

  const integrationMap = useMemo(() => {
    return integrations.reduce<Record<string, Integration>>((acc, integration) => {
      acc[integration.provider] = integration;
      return acc;
    }, {});
  }, [integrations]);

  const integrationSteps = useMemo(() => {
    return requiredPlatforms.map((platform) => {
      const integration = integrationMap[platform.provider];
      const isConnected = Boolean(integration?.isActive);
      return {
        ...platform,
        status: isConnected ? ('connected' as const) : ('disconnected' as const),
        integration,
      };
    });
  }, [requiredPlatforms, integrationMap]);

  const completedSteps = useMemo(
    () => integrationSteps.filter((step) => step.status === 'connected').length,
    [integrationSteps]
  );

  const completionPercent = useMemo(() => {
    if (!integrationSteps.length) return 0;
    return Math.round((completedSteps / integrationSteps.length) * 100);
  }, [completedSteps, integrationSteps.length]);

  const handleToggle = useCallback(
    async (provider: string) => {
      const integration = integrationMap[provider];
      if (!integration) {
        if (onMissingIntegration) {
          onMissingIntegration(
            'Integration record not found. Configure it first via Integrations > Add Integration.'
          );
        }
        return;
      }

      try {
        setActionTarget(provider);
        await updateIntegration(integration.id, { isActive: !integration.isActive });
        await loadIntegrations();
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Unable to update integration status';
        if (onToggleError) {
          onToggleError(message);
        } else {
          throw err;
        }
      } finally {
        setActionTarget(null);
      }
    },
    [integrationMap, loadIntegrations, onMissingIntegration, onToggleError]
  );

  const handleConfigure = useCallback((provider: string, label: string) => {
    const timestamp = new Date().toLocaleString();
    setPlatformAlert({
      title: `${label} integration is not ready yet`,
      description:
        'We are still preparing the API connection for this platform. Please verify access permissions and wait for the administrator to finish setup. You will receive an automatic alert here once it is ready.',
      timestamp,
    });
  }, []);

  return {
    integrations,
    integrationLoading,
    actionTarget,
    platformAlert,
    setPlatformAlert,
    loadIntegrations,
    integrationMap,
    integrationSteps,
    completedSteps,
    completionPercent,
    handleToggle,
    handleConfigure,
  };
};
