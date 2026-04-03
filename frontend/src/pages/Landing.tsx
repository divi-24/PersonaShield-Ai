import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Fingerprint,
  Lock,
  ScanSearch,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden ps-landing-hero text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.04%22%2F%3E%3C%2Fsvg%3E')]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-3 font-semibold tracking-tight text-white"
        >
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/25 ring-1 ring-white/10">
            <Shield className="h-6 w-6 text-white" strokeWidth={2} />
          </span>
          <span className="flex flex-col">
            <span className="text-base">PersonaShield</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Identity AI
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden text-slate-400 sm:inline-flex" asChild>
            <Link to="/app/legal">Legal proof</Link>
          </Button>
          <Button variant="glass" className="rounded-xl border-white/10" asChild>
            <Link to="/app">Open console</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <motion.div
            variants={fade}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.45 }}
            className="max-w-xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] px-4 py-2 text-xs font-medium text-cyan-200 shadow-[0_0_24px_-8px_rgba(34,211,238,0.4)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Neural identity graph · AI-powered analysis</span>
            </div>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-[3.25rem]">
              <span className="text-gradient">Stop deepfakes</span>
              <br />
              <span className="text-gradient-accent">before they spread</span>
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-slate-400 sm:text-lg">
              Enroll biometric references, run synthetic-media scans, and
              export legal-ready proof bundles in one AI security console.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="h-12 min-w-[200px] rounded-xl px-8 text-base shadow-lg shadow-cyan-500/20"
                asChild
              >
                <Link to="/app/register">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="glass"
                className="h-12 min-w-[200px] rounded-xl border-white/10"
                asChild
              >
                <Link to="/app/deepfake">Run a scan</Link>
              </Button>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/[0.06] pt-10 sm:max-w-md">
              {[
                { k: 'Signals', v: '128M+', s: 'analyzed patterns' },
                { k: 'Latency', v: '<2.5s', s: 'average analysis' },
                { k: 'Uptime', v: '99.99%', s: 'availability' },
              ].map((row) => (
                <div key={row.k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {row.k}
                  </dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums text-white">
                    {row.v}
                  </dd>
                  <dd className="text-[11px] text-slate-600">{row.s}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-600/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0f1a]/90 shadow-2xl shadow-black/50 ring-1 ring-white/[0.05] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="ml-2 text-[11px] font-medium text-slate-500">
                    persona-shield.app
                  </span>
                </div>
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  Live
                </span>
              </div>
              <div className="flex gap-0">
                <div className="hidden w-36 shrink-0 border-r border-white/[0.06] bg-black/20 p-3 sm:block">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    Workspace
                  </p>
                  <div className="space-y-1">
                    {['Overview', 'Identity', 'Scan', 'Legal'].map((t, i) => (
                      <div
                        key={t}
                        className={cn(
                          'rounded-lg px-2 py-1.5 text-sm',
                          i === 0
                            ? 'bg-white/10 text-white'
                            : 'text-slate-500'
                        )}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="min-h-[280px] flex-1 p-4 sm:min-h-[320px] sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Authenticity
                      </p>
                      <p className="text-3xl font-bold tabular-nums text-white">
                        94%
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-right">
                      <p className="text-[10px] text-cyan-300/80">Model</p>
                      <p className="text-sm font-semibold text-cyan-100">
                        PS-GUARD v2
                      </p>
                    </div>
                  </div>
                  <div className="mb-4 h-24 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-3 ring-1 ring-white/[0.05]">
                    <div className="flex h-full items-end justify-between gap-1">
                      {[40, 65, 45, 80, 55, 90, 70, 95, 85, 100].map((h, i) => (
                        <div
                          key={i}
                          className="w-full rounded-t-sm bg-gradient-to-t from-cyan-600/40 to-violet-500/60"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                      <Zap className="h-3 w-3 text-amber-400" />
                      Real-time
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                      <Lock className="h-3 w-3 text-emerald-400" />
                      Local vault
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mt-20 grid gap-4 sm:grid-cols-3"
        >
          {[
            {
              icon: Fingerprint,
              title: 'Biometric enrollment',
              body: 'Face and voice references with secure biometric processing and storage.',
            },
            {
              icon: ScanSearch,
              title: 'Deepfake detection',
              body: 'Multi-signal AI analysis with confidence and risk scoring.',
            },
            {
              icon: Scale,
              title: 'Legal assistant',
              body: 'FIR drafts, notices, and exportable PDF proof bundles.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl shadow-black/20 backdrop-blur-sm transition duration-300 hover:border-cyan-500/25 hover:bg-white/[0.04]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/10 transition group-hover:from-cyan-500/20 group-hover:to-violet-500/10">
                <Icon className="h-5 w-5 text-cyan-300" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-y border-white/[0.06] py-8 text-slate-500"
        >
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </span>
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]">
            <ShieldCheck className="h-4 w-4" />
            Zero-trust UI
          </span>
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]">
            <Shield className="h-4 w-4" />
            Audit trails
          </span>
        </motion.div>
      </main>
    </div>
  )
}
