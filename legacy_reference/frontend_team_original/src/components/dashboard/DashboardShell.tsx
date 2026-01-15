import React, { useEffect, useRef, useState } from 'react'
import { LogOut, MessageCircle, Send } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useCurrentUser } from '../../hooks/useCurrentUser'

interface MenuItem {
  label: string
  icon: React.ReactNode
  active?: boolean
  onClick?: () => void
  children?: { label: string; onClick?: () => void }[]
}

export interface ThemeTokens {
  accent: string
  accentSoft: string
  background: string
  surface: string
  surfaceMuted: string
  textPrimary: string
  textMuted: string
  menuFrom: string
  menuTo: string
  sectionFrom: string
  sectionTo: string
  border: string
  cardShadow: string
  mode: 'light' | 'dark' | 'canvas'
}

interface DashboardShellProps {
  title: string
  subtitle: string
  roleLabel: string
  menuItems: MenuItem[]
  menuDescription?: { title: string; description: string }
  actions?: React.ReactNode
  onLogout?: () => void
  onProfileClick?: () => void
  children: React.ReactNode
  theme?: ThemeTokens
}

type CopilotMessage = {
  id: number
  sender: 'user' | 'assistant'
  text: string
}

const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  subtitle,
  roleLabel,
  menuItems,
  menuDescription,
  actions,
  onLogout,
  onProfileClick,
  children,
  theme,
}) => {
  const [miniChatOpen, setMiniChatOpen] = useState(false)
  const [miniChatMessages, setMiniChatMessages] = useState<CopilotMessage[]>([
    {
      id: 1,
      sender: 'assistant',
      text: 'I am the Copilot who can surface insights from Overview, Campaign, SEO, E-commerce, and CRM in seconds—ask me anything.',
    },
  ])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [miniChatInput, setMiniChatInput] = useState('')
  const [miniChatTyping, setMiniChatTyping] = useState(false)
  const miniChatScrollRef = useRef<HTMLDivElement | null>(null)
  
  // Draggable FAB state
  const [isDragging, setIsDragging] = useState(false)
  const [fabPosition, setFabPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fabRef = useRef<HTMLDivElement>(null)
  const { user, loading } = useCurrentUser()
  const displayName = user?.firstName || user?.email || 'Guest'
  const displayEmail = user?.email || '—'
  const displayTitle = user?.title || '—'
  const displayTeam = user?.team || '—'
  const displayLocation = user?.location || '—'
  const displayLastLogin = user?.lastLogin || '—'

  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null)

  useEffect(() => {
    try {
      const savedAvatar = window.localStorage.getItem('rga_profile_avatar')
      if (savedAvatar) {
        setAvatarOverride(savedAvatar)
      }
    } catch {
      // ignore
    }
  }, [])

  const resolvedAvatarUrl = avatarOverride || user?.avatarUrl || null

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (!dataUrl) return
      setAvatarOverride(dataUrl)
      try {
        window.localStorage.setItem('rga_profile_avatar', dataUrl)
      } catch {
        // ignore
      }
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (miniChatScrollRef.current) {
      miniChatScrollRef.current.scrollTop = miniChatScrollRef.current.scrollHeight
    }
  }, [miniChatMessages, miniChatTyping])

  // Apply theme tokens to CSS variables so index.css themed classes can react
  useEffect(() => {
    if (!theme) return
    const root = document.documentElement
    root.style.setProperty('--theme-background', theme.background)
    root.style.setProperty('--theme-surface', theme.surface)
    root.style.setProperty('--surface-muted', theme.surfaceMuted)
    root.style.setProperty('--theme-text', theme.textPrimary)
    root.style.setProperty('--theme-muted', theme.textMuted)
    root.style.setProperty('--menu-from', theme.menuFrom)
    root.style.setProperty('--menu-to', theme.menuTo)
    root.style.setProperty('--section-from', theme.sectionFrom)
    root.style.setProperty('--section-to', theme.sectionTo)
    root.style.setProperty('--theme-section-from', theme.sectionFrom)
    root.style.setProperty('--theme-section-to', theme.sectionTo)
    root.style.setProperty('--theme-border', theme.border)
    root.style.setProperty('--theme-card-shadow', theme.cardShadow)
    root.style.setProperty('--accent-color', theme.accent)
  }, [theme])

  // Draggable FAB handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    // Store the mouse position relative to the FAB's current position
    const rect = fabRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    // Calculate new position based on mouse position and drag offset
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Get FAB dimensions for precise boundary calculation
    const fabWidth = 280 // approximate FAB width (button + text)
    const fabHeight = 60 // approximate FAB height
    
    // Calculate viewport boundaries
    const minX = 10 // 10px padding from left
    const minY = 10 // 10px padding from top
    const maxX = window.innerWidth - fabWidth - 10 // 10px padding from right
    const maxY = window.innerHeight - fabHeight - 10 // 10px padding from bottom
    
    // Keep FAB within viewport bounds
    const boundedX = Math.max(minX, Math.min(newX, maxX))
    const boundedY = Math.max(minY, Math.min(newY, maxY))
    
    // Calculate the transform values relative to the original bottom-right position
    const originalRight = 32 // 2rem = 32px
    const originalBottom = 32 // 2rem = 32px
    
    setFabPosition({ 
      x: boundedX - (window.innerWidth - originalRight - fabWidth), 
      y: boundedY - (window.innerHeight - originalBottom - fabHeight)
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const clearChatHistory = () => {
    setMiniChatMessages([
      {
        id: 1,
        sender: 'assistant',
        text: 'I am the Copilot who can surface insights from Overview, Campaign, SEO, E-commerce, and CRM in seconds—ask me anything.',
      },
    ])
    setMiniChatInput('')
  }

  const buildCopilotResponse = (prompt: string) => {
    const normalized = prompt.toLowerCase()
    if (normalized.includes('overview')) {
      return 'The Overview Dashboard surfaces real-time KPIs, hero cards, and trend charts the leadership team monitors each day.'
    }
    if (normalized.includes('campaign')) {
      return 'Campaign Performance highlights current campaign status, conversion funnels, and the channels driving the strongest ROI.'
    }
    if (normalized.includes('seo') || normalized.includes('web')) {
      return 'SEO & Web Analytics reveals organic performance, traffic sources, and search-driven conversions in detail.'
    }
    if (normalized.includes('commerce') || normalized.includes('product') || normalized.includes('video')) {
      return 'E-commerce Insights combines product video stats, creative cards, revenue trends, and conversion funnels in one view.'
    }
    if (normalized.includes('crm') || normalized.includes('lead')) {
      return 'CRM & Leads surfaces pipeline health, lead quality, and sales activities so you know which stage to focus on next.'
    }
    return 'I can describe any dashboard section or call out KPIs worth watching—drop your question and I will guide you.'
  }

  const handleMiniChatSend = () => {
    const trimmed = miniChatInput.trim()
    if (!trimmed) return
    const userMessage: CopilotMessage = { id: Date.now(), sender: 'user', text: trimmed }
    setMiniChatMessages((prev) => [...prev, userMessage])
    setMiniChatInput('')
    setMiniChatTyping(true)
    setTimeout(() => {
      const reply: CopilotMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: buildCopilotResponse(trimmed),
      }
      setMiniChatMessages((prev) => [...prev, reply])
      setMiniChatTyping(false)
    }, 700)
  }

  const handleMiniChatKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleMiniChatSend()
    }
  }

  const modeClass =
    theme?.mode === 'dark'
      ? 'theme-dark'
      : theme?.mode === 'canvas'
      ? 'theme-canvas'
      : 'theme-light'

  const isDark = theme?.mode === 'dark'

  return (
    <div
      className={cn('min-h-screen dashboard-theme flex', modeClass)}
      style={{ backgroundColor: theme?.background }}
    >
      <aside
        className="hidden xl:flex flex-col w-[280px] min-w-[260px] bg-gradient-to-b text-white px-3 py-4 space-y-6 sticky top-0 h-screen overflow-y-auto"
        style={{
          backgroundImage:
            theme?.menuFrom && theme?.menuTo
              ? `linear-gradient(to bottom, ${theme.menuFrom}, ${theme.menuTo})`
              : undefined,
        }}
      >
        <div>
          <p className="text-2xl font-black tracking-tight leading-none text-orange-400">RGA</p>
          <p className="text-xs text-orange-200 tracking-wider uppercase">Rise Group Asia</p>
        </div>

        <div
          className="rounded-2xl p-5 space-y-3 shadow-inner border border-orange-900/30"
          style={{ backgroundColor: theme?.menuFrom }}
        >
          <p className="text-xs uppercase text-orange-100 tracking-wider mb-3">Profile</p>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col justify-center mt-1 min-w-0">
              <p className="font-semibold text-white/95 leading-none mb-2 truncate" style={{ fontSize: '18px' }}>
                {loading ? 'Loading…' : displayName}
              </p>
              <p className="truncate text-orange-300 leading-none mt-0.5" style={{ fontSize: '12px' }}>
                {displayEmail}
              </p>
            </div>
            <button
              type="button"
              className="relative h-12 w-12 rounded-2xl overflow-hidden bg-white/10 cursor-pointer flex-shrink-0"
              onClick={() => avatarInputRef.current?.click()}
              title="Change profile photo"
            >
              {resolvedAvatarUrl ? (
                <img src={resolvedAvatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg font-bold">
                  {displayName.charAt(0)}
                </div>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-[10px] font-semibold py-0.5">
                Edit
              </span>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </button>
          </div>
        </div>

        <nav className="flex-1 flex flex-col">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const hasChildren = !!item.children?.length
              const expanded = hasChildren && openDropdown === item.label
              const handleClick = () => {
                item.onClick?.()
                if (hasChildren) {
                  setOpenDropdown((prev) => (prev === item.label ? null : item.label))
                } else {
                  setOpenDropdown(null)
                }
              }
              return (
                <div key={item.label} className="space-y-2 relative">
                  <button
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left text-[13px] font-semibold tracking-wide',
                      item.active
                        ? 'shadow-lg text-white'
                        : 'text-orange-300 hover:bg-orange-900/20',
                    )}
                    style={
                      item.active && theme?.menuTo
                        ? { backgroundColor: theme.menuTo }
                        : undefined
                    }
                    onClick={handleClick}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {hasChildren && <span className="text-sm text-orange-200">{expanded ? '–' : '+'}</span>}
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300',
                      expanded ? 'max-h-96 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2',
                    )}
                  >
                    {hasChildren && (
                      <div
                        className="mt-2 rounded-2xl border border-orange-900/40 p-3 space-y-1 shadow-2xl"
                        style={{ backgroundColor: theme?.menuFrom }}
                      >
                        {item.children?.map((child) => (
                          <button
                            key={child.label}
                            className="w-full text-left text-sm text-orange-100 hover:text-white transition px-3 py-2 rounded-xl hover:bg-orange-900/25 hover:translate-x-0.5"
                            onClick={(event) => {
                              event.stopPropagation()
                              child.onClick?.()
                            }}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {menuDescription && (
            <div
              className="mt-4 rounded-2xl border border-orange-900/40 bg-gradient-to-br p-4 space-y-1 text-sm text-orange-100 shadow-inner"
              style={{
                backgroundImage:
                  theme?.menuFrom && theme?.menuTo
                    ? `linear-gradient(135deg, ${theme.menuFrom}, ${theme.menuTo})`
                    : undefined,
              }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-orange-400">{menuDescription.title}</p>
              <p className="text-[13px] leading-relaxed text-orange-50/90">{menuDescription.description}</p>
            </div>
          )}

          <button
            className="mt-6 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[16px] font-semibold tracking-wide text-orange-200 hover:bg-orange-900/20 transition"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-[calc(100vw-280px)]">
        <div className="sticky top-0 z-30">
          <div
            className="backdrop-blur border-b border-orange-100/60 shadow-sm -mx-6 lg:-mx-10 px-6 lg:px-10 py-4"
            style={{ backgroundColor: theme?.surface ?? '#fdf6f0' }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase text-gray-500 tracking-[0.3em]">{roleLabel}</p>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                <p className="text-base text-gray-500 max-w-2xl">{subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                {actions}
                
              </div>
            </div>
          </div>
        </div>
        {children}
      </main>
      <div 
  ref={fabRef}
  className="fixed z-40 flex flex-col items-end gap-2"
  style={{
    bottom: '2rem',
    right: '2rem',
    transform: `translate(${fabPosition.x}px, ${fabPosition.y}px)`,
    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
  }}
>
  <button
    type="button"
    onClick={() => setMiniChatOpen((prev) => !prev)}
    onMouseDown={handleMouseDown}
    className={cn(
      'group relative inline-flex items-center gap-3 rounded-3xl border px-5 py-3 text-sm font-semibold shadow-[0_25px_60px_rgba(249,115,22,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_35px_70px_rgba(249,115,22,0.3)]',
      isDark
        ? 'border-orange-500/40 bg-[#020617] text-orange-50'
        : 'border-orange-100 bg-white/95 text-gray-800',
      isDragging ? 'cursor-grabbing' : 'cursor-grab',
    )}
  >
    <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-200 text-white shadow-lg">
      <MessageCircle className="h-9 w-9" />
      <span className="absolute -top-1 -right-1 inline-flex h-8 w-8 animate-ping rounded-full bg-white/70" />
      <span className="absolute -top-1 -right-1 inline-flex h-8 w-8 rounded-full bg-amber-100" />
    </span>
    <span className="flex flex-col text-left">
      <span className="text-[11px] uppercase tracking-[0.4em] text-orange-400">Copilot</span>
      <span>{miniChatOpen ? 'Hide Copilot chat' : 'Ask me anything'}</span>
    </span>
  </button>
  {!miniChatOpen && (
    <div
      className={cn(
        'rounded-2xl border px-4 py-2 text-xs shadow-lg',
        isDark
          ? 'border-orange-500/40 bg-[#020617] text-orange-100'
          : 'border-orange-100 bg-white text-gray-600',
      )}
    >
      "Need a KPI fast? Ping me anytime."
    </div>
  )}
  {miniChatOpen && (
    <div
      className={cn(
        'fixed right-8 bottom-20 w-72 rounded-3xl border p-5 shadow-2xl space-y-3 z-50',
        isDark
          ? 'border-orange-500/40 bg-[#020617] text-orange-50'
          : 'border-orange-100 bg-white',
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-orange-400">RGA Copilot</p>
          <p className="text-sm text-gray-500">Instant guidance across every dashboard tab.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-gray-400 hover:text-gray-600" onClick={clearChatHistory}>
            Clear
          </button>
          <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setMiniChatOpen(false)}>
            Close
          </button>
        </div>
      </div>
      <div ref={miniChatScrollRef} className="max-h-60 space-y-2 overflow-y-auto pr-1">
        {miniChatMessages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-orange-500 via-orange-400 to-amber-200 text-white'
                  : 'bg-orange-50 text-gray-700'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {miniChatTyping && (
          <div className="text-[11px] text-orange-400">Typing a response...</div>
        )}
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50 px-3">
        <input
          type="text"
          value={miniChatInput}
          onChange={(event) => setMiniChatInput(event.target.value)}
          onKeyDown={handleMiniChatKeyDown}
          placeholder="Ask about any dashboard surface"
          className="flex-1 bg-transparent py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleMiniChatSend}
          disabled={!miniChatInput.trim() || miniChatTyping}
          className="rounded-2xl bg-gray-900 p-2 text-white shadow disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )}
</div>
    </div>
  )
}

export default DashboardShell
