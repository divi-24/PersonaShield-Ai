import { motion } from 'framer-motion'
import {
  Brain,
  FileText,
  Fingerprint,
  LayoutDashboard,
  Menu,
  Scale,
  ScanSearch,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  BookUser,
  Users,
  X,
} from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const navGroups: {
  label: string
  items: { to: string; label: string; icon: typeof Shield; end?: boolean }[]
}[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Protect',
    items: [
      { to: '/app/register', label: 'Identity', icon: Fingerprint },
      { to: '/app/enrollments', label: 'Enrollments', icon: BookUser },
      { to: '/app/deepfake', label: 'Deepfake Scan', icon: ScanSearch },
      { to: '/app/results', label: 'Match & Scores', icon: Brain },
    ],
  },
  {
    label: 'Legal & trust',
    items: [
      { to: '/app/legal', label: 'Legal Proof', icon: FileText },
      { to: '/app/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { to: '/app/misuse', label: 'Report Misuse', icon: Shield },
      { to: '/app/disputes', label: 'Disputes', icon: Users },
      { to: '/app/assistant', label: 'AI Legal', icon: Scale },
    ],
  },
]

export function AppShell({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen ps-grid text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ps-aurora" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(3,7,18,0.85)_85%)]" />
        <div className="ps-noise" />
      </div>

      <AlertBanner />

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#030712]/80 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            to="/app"
            className="flex shrink-0 items-center gap-3 rounded-xl pr-2 transition-opacity hover:opacity-95"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20 ring-1 ring-white/10">
              <Shield className="h-[22px] w-[22px] text-white" strokeWidth={2} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#030712]" />
            </span>
            <span className="hidden flex-col sm:flex">
              <span className="text-[13px] font-semibold leading-tight tracking-tight text-white">
                PersonaShield
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Console
              </span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">/</span>
              <span className="truncate text-xs font-medium text-slate-400">
                {location.pathname === '/app' ? 'Overview' : 'Workspace'}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden cursor-default items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300/95 sm:inline-flex">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                AI-powered deepfake detection and identity verification.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="hidden w-full max-w-[220px] items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-left text-xs text-slate-500 transition hover:border-white/12 hover:bg-white/5 md:flex"
                  aria-label="Search (demo)"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="flex-1 truncate">Search scans, reports…</span>
                  <kbd className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:inline-block">
                    ⌘K
                  </kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Search scans, reports, and identities.
              </TooltipContent>
            </Tooltip>
            <Button
              variant="glass"
              size="sm"
              className="hidden border-white/10 sm:inline-flex"
              asChild
            >
              <Link to="/">Marketing</Link>
            </Button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9 ring-2 ring-offset-2 ring-offset-[#030712] ring-white/10',
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Identity settings"
                  labelIcon={<Fingerprint className="h-4 w-4" />}
                  onClick={() => navigate('/app/register')}
                />
                <UserButton.Action
                  label="Legal exports"
                  labelIcon={<FileText className="h-4 w-4" />}
                  onClick={() => navigate('/app/legal')}
                />
              </UserButton.MenuItems>
            </UserButton>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[1440px] gap-0 px-0 pb-10 pt-6 sm:px-6 lg:gap-8 lg:pt-8">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-[280px] border-r border-white/6 bg-[#030712]/95 p-6 pt-20 backdrop-blur-xl transition-transform lg:static lg:z-0 lg:w-60 lg:border-0 lg:bg-transparent lg:p-0 lg:pt-0',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <nav className="flex flex-col gap-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl py-2.5 pl-4 pr-3 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-white/8 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                            : 'text-slate-400 hover:bg-white/4 hover:text-slate-200'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'absolute left-1.5 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full transition-colors',
                              isActive
                                ? 'bg-linear-to-b from-cyan-400 to-violet-500'
                                : 'bg-transparent group-hover:bg-white/15'
                            )}
                          />
                          <Icon
                            className={cn(
                              'relative h-[18px] w-[18px] shrink-0 transition-colors',
                              isActive
                                ? 'text-cyan-300'
                                : 'text-slate-500 group-hover:text-slate-400'
                            )}
                            strokeWidth={isActive ? 2.25 : 1.75}
                          />
                          <span className="relative flex-1">{label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {open && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        )}

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 flex-1 px-4 sm:px-0 lg:ml-0"
        >
          {children ?? <Outlet />}
        </motion.main>
      </div>
    </div>
  )
}
