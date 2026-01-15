import React, { forwardRef } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import type { IntegrationChecklistAlert, IntegrationChecklistStep } from '../../integrations/useIntegrationChecklist';

export type { IntegrationChecklistAlert, IntegrationChecklistStep } from '../../integrations/useIntegrationChecklist';

type Props = {
  titleNode?: React.ReactNode;
  themePanelClass: string;
  completionPercent: number;
  completedSteps: number;
  totalSteps: number;
  platformAlert: IntegrationChecklistAlert | null;
  integrationLoading: boolean;
  integrationSteps: IntegrationChecklistStep[];
  actionTarget: string | null;
  onNavigateIntegrations: () => void;
  onRefresh: () => void | Promise<void>;
  onToggle: (provider: string) => void | Promise<void>;
  onConfigure: (provider: string, label: string) => void;
};

const DashboardIntegrationChecklist = forwardRef<HTMLDivElement, Props>(
  (
    {
      titleNode,
      themePanelClass,
      completionPercent,
      completedSteps,
      totalSteps,
      platformAlert,
      integrationLoading,
      integrationSteps,
      actionTarget,
      onNavigateIntegrations,
      onRefresh,
      onToggle,
      onConfigure,
    },
    ref
  ) => (
    <div ref={ref} className={`${themePanelClass} shadow p-6 space-y-6`}>
      <div className="flex flex-col gap-4">
        {titleNode ?? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2 max-w-4xl">
              <h2 className="text-[24px] leading-snug md:text-[24px] font-semibold text-gray-900  break-words">
                Integration Checklist
              </h2>
              <p className="text-gray-500 !text-[16px] !leading-relaxed !mb-0 break-words">
                Connect data sources for real-time insights
              </p>
            </div>
          </div>
        )}

        {/* Progress Summary */}
        <div className="theme-panel-soft rounded-[26px] p-4 space-y-2 shadow-[0_10px_40px_-25px_rgba(249,115,22,0.8)]">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-gray-900">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.15)]" />
              Connections in progress
            </div>
            <button
              type="button"
              className="text-[9px] font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              onClick={onNavigateIntegrations}
            >
              keep connection
            </button>
          </div>
          <div className="relative h-4 rounded-full bg-gray-100/90 border border-white shadow-inner overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, completionPercent)}%` }}
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-[9px] font-semibold text-orange-600">
              {completionPercent}%
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[9px] text-gray-500">
            <span className="font-semibold text-gray-800">
              You&apos;re {completedSteps} out of {totalSteps} steps complete
            </span>
            <span className="text-orange-500">•</span>
            <span>Stay synced for accurate KPIs</span>
          </div>
        </div>

        {/* Alerts Section */}
        {platformAlert && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{platformAlert.title}</p>
                <p className="text-xs text-gray-600">{platformAlert.description}</p>
                <p className="text-xs text-gray-400 mt-1">{platformAlert.timestamp}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            onClick={onNavigateIntegrations}
          >
            Open workspace
          </button>
          <button
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-2"
            onClick={onRefresh}
            disabled={integrationLoading}
          >
            {integrationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <button
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            onClick={onNavigateIntegrations}
          >
            Configure
          </button>
          <button
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors open-data-btn"
            onClick={onNavigateIntegrations}
          >
            Open data setup
          </button>
        </div>

        {/* Integration List */}
        <div className="space-y-0">
          {integrationLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm">Loading integrations...</span>
            </div>
          ) : (
            integrationSteps.map((step) => (
              <div
                key={step.id}
                className="theme-panel flex flex-col gap-1.5 rounded-2xl px-4 py-4 md:flex-row md:items-center md:justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`${step.color} p-2 rounded-xl shadow-sm flex items-center justify-center`}>{step.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-[1.05] m-1">{step.label}</p>
                    <p className="text-xs text-gray-500 leading-[1.05] m-1">{step.description}</p>
                    {step.integration?.lastSyncAt && (
                      <p className="text-xs text-gray-400 leading-[1.05] m-1">
                        Last sync · {new Date(step.integration.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium text-center whitespace-nowrap min-w-[100px] border ${
                      step.status === 'connected'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : 'border-gray-200 text-gray-500 bg-gray-50'
                    }`}
                  >
                    {step.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                  <div className="flex flex-col gap-1 sm:flex-row">
                    {step.integration ? (
                      <button
                        className={`min-w-[120px] rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          step.status === 'connected'
                            ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }`}
                        onClick={() => onToggle(step.provider)}
                        disabled={actionTarget === step.provider}
                      >
                        {actionTarget === step.provider ? (
                          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                        ) : step.status === 'connected' ? (
                          'Disconnect'
                        ) : (
                          'Activate'
                        )}
                      </button>
                    ) : (
                      <button
                        className="min-w-[120px] rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 transition-colors"
                        onClick={() => onConfigure(step.provider, step.label)}
                      >
                        Configure
                      </button>
                    )}
                    <button
                      className="min-w-[120px] rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark-theme-hover open-data-btn"
                      onClick={() => onConfigure(step.provider, step.label)}
                    >
                      Open data setup
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
);

DashboardIntegrationChecklist.displayName = 'DashboardIntegrationChecklist';

export default DashboardIntegrationChecklist;
