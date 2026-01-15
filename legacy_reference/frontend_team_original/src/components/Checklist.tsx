import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Facebook, MessageCircle, Music, RefreshCw, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from './ui/button'
import { IntegrationNotification } from '../types/api'
import { updateIntegration } from '../services/api'
import { useIntegrationNotifications } from '../hooks/useIntegrationNotifications'
import { REQUIRED_PLATFORMS_CHECKLIST } from '../features/integrations/requiredPlatforms'
import { useIntegrationChecklist } from '../features/integrations/useIntegrationChecklist'
import { setHasCompletedChecklist } from '../services/auth/session'

const Checklist: React.FC = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [bulkActionTarget, setBulkActionTarget] = useState<string | null>(null)
  const { notifications, loading: loadingNotifications, error: notificationError, refetch } = useIntegrationNotifications('open')

  const {
    integrations,
    integrationLoading: loading,
    actionTarget,
    platformAlert,
    loadIntegrations: baseLoadIntegrations,
    integrationSteps: steps,
    completedSteps,
    completionPercent,
    handleToggle,
    handleConfigure,
  } = useIntegrationChecklist(REQUIRED_PLATFORMS_CHECKLIST, {
    onLoadError: (message) => setError(message),
    onToggleError: (message) => setError(message),
    onMissingIntegration: (message) => setError(message),
  })

  const loadIntegrations = useCallback(async () => {
    setError(null)
    await baseLoadIntegrations()
  }, [baseLoadIntegrations])

  useEffect(() => {
    loadIntegrations()
    refetch()
  }, [loadIntegrations])


  const handleResetAll = async () => {
    const activeIntegrations = integrations.filter((integration) => integration.isActive)
    if (!activeIntegrations.length) {
      return
    }

    try {
      setBulkActionTarget('reset-all')
      await Promise.all(activeIntegrations.map((integration) => updateIntegration(integration.id, { isActive: false })))
      await loadIntegrations()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reset integrations')
    } finally {
      setBulkActionTarget(null)
    }
  }

  const handleSkip = () => {
    setHasCompletedChecklist(true)
    navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-8 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-100"
          style={{ backgroundImage: "url('/image/galaxy-wallpaper-warm-colors.jpg')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,190,92,0.25),_transparent_75%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(5,5,5,0.2),rgba(5,5,5,0.2))]" />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-10 top-6 h-64 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute inset-x-20 bottom-6 h-80 rounded-full bg-black/30 blur-[160px]" />
        
        {/* Combined Effects: Stars + Aurora + Glow (7 Points) */}
        <div className="absolute inset-0">
          {/* Aurora Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-orange-500/5 to-purple-400/10 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/5 to-orange-300/8 animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }} />
          
          {/* 20 Glow Points - Expanded variety */}
          {/* Top Left: 3 points */}
          <div className="absolute top-20 left-32 h-32 w-32 rounded-full bg-orange-400/20 blur-[80px] animate-pulse" style={{ animationDelay: '0s', animationDuration: '4s' }} />
          <div className="absolute top-16 left-60 h-24 w-24 rounded-full bg-orange-600/18 blur-[60px] animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '3.5s' }} />
          <div className="absolute top-8 left-24 h-16 w-16 rounded-full bg-amber-500/22 blur-[40px] animate-pulse" style={{ animationDelay: '2.8s', animationDuration: '3.2s' }} />
          
          {/* Top Right: 3 points */}
          <div className="absolute top-32 right-24 h-28 w-28 rounded-full bg-amber-400/15 blur-[70px] animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '4.5s' }} />
          <div className="absolute top-12 right-40 h-20 w-20 rounded-full bg-yellow-300/25 blur-[50px] animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '4s' }} />
          <div className="absolute top-48 right-16 h-18 w-18 rounded-full bg-orange-500/16 blur-[45px] animate-pulse" style={{ animationDelay: '3.2s', animationDuration: '3.8s' }} />
          
          {/* Bottom Left: 3 points */}
          <div className="absolute bottom-28 left-40 h-20 w-20 rounded-full bg-yellow-400/22 blur-[50px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }} />
          <div className="absolute bottom-16 left-24 h-24 w-24 rounded-full bg-amber-600/14 blur-[65px] animate-pulse" style={{ animationDelay: '2.2s', animationDuration: '4.2s' }} />
          <div className="absolute bottom-40 left-60 h-16 w-16 rounded-full bg-orange-300/20 blur-[42px] animate-pulse" style={{ animationDelay: '3.6s', animationDuration: '3.4s' }} />
          
          {/* Bottom Right: 3 points */}
          <div className="absolute bottom-20 right-36 h-16 w-16 rounded-full bg-orange-500/25 blur-[40px] animate-pulse" style={{ animationDelay: '3s', animationDuration: '5s' }} />
          <div className="absolute bottom-32 right-20 h-22 w-22 rounded-full bg-yellow-500/18 blur-[55px] animate-pulse" style={{ animationDelay: '1.3s', animationDuration: '3.6s' }} />
          <div className="absolute bottom-8 right-28 h-18 w-18 rounded-full bg-amber-400/21 blur-[48px] animate-pulse" style={{ animationDelay: '2.7s', animationDuration: '4.1s' }} />
          
          {/* Center Area: 4 points */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-amber-300/12 blur-[100px] animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '5s' }} />
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 h-36 w-36 rounded-full bg-orange-400/16 blur-[90px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }} />
          <div className="absolute top-2/5 right-2/5 h-28 w-28 rounded-full bg-yellow-400/14 blur-[75px] animate-pulse" style={{ animationDelay: '1.8s', animationDuration: '4.3s' }} />
          <div className="absolute top-3/5 left-2/5 h-24 w-24 rounded-full bg-amber-500/17 blur-[68px] animate-pulse" style={{ animationDelay: '0.3s', animationDuration: '3.7s' }} />
          
          {/* Middle Edges: 4 points */}
          <div className="absolute top-1/4 left-8 h-20 w-20 rounded-full bg-orange-400/19 blur-[52px] animate-pulse" style={{ animationDelay: '2.4s', animationDuration: '4.6s' }} />
          <div className="absolute top-1/3 right-12 h-18 w-18 rounded-full bg-yellow-300/23 blur-[46px] animate-pulse" style={{ animationDelay: '1.6s', animationDuration: '3.9s' }} />
          <div className="absolute bottom-1/4 left-16 h-22 w-22 rounded-full bg-amber-400/15 blur-[58px] animate-pulse" style={{ animationDelay: '3.1s', animationDuration: '4.4s' }} />
          <div className="absolute bottom-1/3 right-8 h-20 w-20 rounded-full bg-orange-600/20 blur-[54px] animate-pulse" style={{ animationDelay: '0.7s', animationDuration: '4.8s' }} />
          
          {/* Twinkling Stars */}
          <div className="absolute top-10 left-20 h-1 w-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }} />
          <div className="absolute top-32 right-40 h-1 w-1 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
          <div className="absolute top-60 left-1/3 h-1 w-1 rounded-full bg-white/90 animate-pulse" style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
          <div className="absolute bottom-40 right-20 h-1 w-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
          <div className="absolute bottom-20 left-40 h-1 w-1 rounded-full bg-white/70 animate-pulse" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
          <div className="absolute top-1/4 right-1/4 h-1 w-1 rounded-full bg-white/85 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '2.8s' }} />
          <div className="absolute top-1/2 left-1/4 h-1 w-1 rounded-full bg-white/95 animate-pulse" style={{ animationDelay: '3s', animationDuration: '2.2s' }} />
          <div className="absolute top-3/4 right-1/3 h-1 w-1 rounded-full bg-white/75 animate-pulse" style={{ animationDelay: '3.5s', animationDuration: '3.2s' }} />
          <div className="absolute top-16 left-60 h-1 w-1 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '4s', animationDuration: '2.6s' }} />
          <div className="absolute bottom-32 right-60 h-1 w-1 rounded-full bg-white/90 animate-pulse" style={{ animationDelay: '4.5s', animationDuration: '2.4s' }} />
        </div>
      </div>
      <div className="relative w-full max-w-5xl rounded-[40px] border border-white/10 bg-white/97 p-10 shadow-[0_60px_120px_rgba(0,0,0,0.45)] space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 text-white">
            <p className="text-xs uppercase tracking-[0.0em] text-orange-300">Onboarding flow</p>
            <h1 className="text-4xl font-bold text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.45)]">Checklist</h1>
            <p className="text-base text-white/80 max-w-xl leading-relaxed">Link every data source to unlock the full real-time dashboard experience before entering the live RGA workspace.</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-orange-400/60 bg-gradient-to-br from-black/85 via-orange-950/40 to-orange-900/30 backdrop-blur-sm px-8 py-6 text-white shadow-[0_25px_50px_rgba(255,140,0,0.3)]">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute -top-10 -right-6 h-52 w-52 rounded-full bg-orange-500/30 blur-[90px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_70%)]" />
            </div>
            <div className="relative space-y-4">
              <p className="text-xs uppercase tracking-[0.0em] text-orange-200">Rise Group Asia</p>
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-200 text-2xl font-black tracking-tight text-black shadow-[0_0_35px_rgba(249,115,22,0.45)]">
                  RGA
                </div>
                <div>
                  <p className="text-xl font-semibold leading-snug text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.55)]">Intelligence Operations Suite</p>
                  <p className="text-xs tracking-[0.0em] text-white/80 uppercase">Mission Control Checklist</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs font-medium text-white/80">
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 ring-2 ring-orange-300/50 shadow-[0_0_6px_rgba(251,146,60,0.8)]" />Sync readiness</span>
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 ring-2 ring-emerald-300/50 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />Security verified</span>
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-white/90 to-white ring-2 ring-white/30 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />Ops escalation plan</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-orange-300/50 bg-gradient-to-br from-black/85 via-orange-950/40 to-orange-900/30 backdrop-blur-sm p-6 text-white shadow-[0_25px_50px_rgba(255,140,0,0.25)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.0em] text-white/60">Progress</p>
                <h2 className="text-2xl font-semibold text-white">Welcome to RGA Dashboard</h2>
                <p className="text-sm text-white/60">
                  You're {completedSteps} out of {steps.length} integrations online
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-orange-300">{completionPercent}%</p>
                <p className="text-xs uppercase tracking-[0.em] text-white/40">Complete</p>
              </div>
            </div>
            <div className="mt-6 h-4 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 shadow-[0_0_12px_rgba(249,115,22,0.7)] transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-orange-300/50 bg-gradient-to-br from-black/85 via-orange-950/40 to-orange-900/30 backdrop-blur-sm p-6 text-white shadow-[0_25px_50px_rgba(255,140,0,0.25)]">
            {notificationError && (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {notificationError}
              </div>
            )}
            {platformAlert && (
              <div className="mb-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold text-white">{platformAlert.title}</p>
                    <p className="text-sm text-white/80">{platformAlert.description}</p>
                    <p className="text-xs text-white/50 mt-1">Updated {platformAlert.timestamp}</p>
                  </div>
                </div>
              </div>
            )}
            {!loadingNotifications && notifications.length > 0 && (
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-orange-300">Alerts</p>
                    <h3 className="text-xl font-semibold text-white">Action required</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/80 hover:bg-white/10"
                    onClick={refetch}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh alerts
                  </Button>
                </div>

                <div className="space-y-3">
                  {notifications.map((alert: IntegrationNotification) => (
                    <div
                      key={alert.id}
                      className="flex flex-col gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-300" />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {alert.title}
                            {alert.integration?.name ? ` · ${alert.integration.name}` : ''}
                          </p>
                          {alert.reason && <p className="text-xs text-white/80">{alert.reason}</p>}
                          <p className="text-xs text-white/50">
                            {new Date(alert.createdAt).toLocaleString()} · {alert.platform.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      {alert.actionUrl && (
                        <Button
                          variant="outline"
                          className="w-full border-white/25 text-white hover:bg-white/10 sm:w-auto"
                          onClick={() => window.open(alert.actionUrl!, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" /> Go to setup
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.0em] text-white/50">Integrations</p>
<h3 className="text-xl font-bold text-white">Connect external APIs</h3>              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto gap-2 border-white/30 bg-white/5 text-white hover:bg-white/10 justify-center"
                  onClick={() => navigate('/integrations')}
                >
                  Open workspace
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto gap-2 border-white/30 bg-white/5 text-white hover:bg-white/10 justify-center"
                  onClick={loadIntegrations}
                  disabled={loading || bulkActionTarget === 'reset-all'}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto gap-2 border-white/30 bg-white/5 text-white hover:bg-white/10 justify-center"
                  onClick={handleResetAll}
                  disabled={!integrations.some((integration) => integration.isActive) || bulkActionTarget === 'reset-all'}
                >
                  {bulkActionTarget === 'reset-all' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Reset all
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12 text-white/60">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Fetching integrations from the API...
              </div>
            ) : (
              <div className="space-y-0">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#0b0b0b]/80 px-5 py-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`${step.color} p-3 rounded-2xl shadow-lg shadow-black/40`}>{step.icon}</div>
                      <div>
                        <p className="text-lg font-semibold text-white leading-tight">{step.label}</p>
                        <p className="text-sm text-white/70 leading-tight">{step.description}</p>
                        {step.integration?.lastSyncAt && (
                          <p className="text-xs text-white/40 leading-tight">
                            Last sync · {new Date(step.integration.lastSyncAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium text-center whitespace-nowrap w-full sm:w-auto min-w-[110px] border ${
                          step.status === 'connected'
                            ? 'border-emerald-400/30 text-emerald-200 bg-emerald-500/10'
                            : 'border-white/20 text-white/70'
                        }`}
                      >
                        {step.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                      <div className="flex flex-col gap-1 sm:flex-row">
                        {step.integration ? (
                          <Button
                            variant="outline"
                            className={`min-w-[150px] border transition ${
                              step.status === 'connected'
                                ? 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10'
                                : 'border-orange-400/60 text-orange-200 hover:bg-orange-500/10'
                            }`}
                            onClick={() => handleToggle(step.provider)}
                            disabled={actionTarget === step.provider}
                          >
                            {actionTarget === step.provider ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : step.status === 'connected' ? (
                              'Disconnect'
                            ) : (
                              'Activate'
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="min-w-[150px] border border-orange-400/60 text-orange-200 hover:bg-orange-500/10"
                            onClick={() => handleConfigure(step.provider, step.label)}
                          >
                            Configure
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="w-full sm:min-w-[150px] border-white/25 text-white/80 hover:bg-white/10"
                          onClick={() => handleConfigure(step.provider, step.label)}
                        >
                          Open data setup
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 py-3 text-lg border-white/30 text-white hover:bg-white/10"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checklist
