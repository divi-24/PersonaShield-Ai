import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Cpu,
  Fingerprint,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppState } from '@/context/AppStateContext'

function authenticityLevel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 75) return 'High'
  if (score >= 45) return 'Medium'
  return 'Low'
}

export function DashboardPage() {
  const { selectedIdentity, lastAnalysis, analyses, identities, loading, triggerDemoAlert } = useAppState()

  const authenticity = lastAnalysis?.authenticity_score ?? null
  const level = authenticity != null ? authenticityLevel(authenticity) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Workspace"
        title="Command center"
        description="Monitor enrollment, authenticity posture, and recent AI analysis."
        badges={
          <>
            <Badge variant="muted" className="rounded-lg font-normal">
              {identities.length} {identities.length === 1 ? 'identity' : 'identities'}
            </Badge>
            <Badge variant="muted" className="rounded-lg font-normal">
              {analyses.length} {analyses.length === 1 ? 'scan' : 'scans'}
            </Badge>
          </>
        }
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: 'Enrollment',
                value: identities.length > 0 ? 'Active' : 'Pending',
                sub: identities.length > 0
                  ? `${identities.length} registered`
                  : 'Complete identity setup',
                icon: Fingerprint,
                tone: identities.length > 0 ? 'text-emerald-400' : 'text-amber-400',
              },
              {
                label: 'Last scan',
                value: lastAnalysis
                  ? lastAnalysis.is_deepfake
                    ? 'Review'
                    : 'Clear'
                  : 'None',
                sub: lastAnalysis
                  ? `${lastAnalysis.deepfake_score}% deepfake score`
                  : 'Run Deepfake Scan',
                icon: Activity,
                tone: 'text-cyan-400',
              },
              {
                label: 'Model',
                value: 'PS-GUARD',
                sub: 'AI-powered analysis',
                icon: Cpu,
                tone: 'text-violet-400',
              },
            ].map((k) => {
              const Icon = k.icon
              return (
                <div
                  key={k.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-4 shadow-sm backdrop-blur-sm transition hover:border-white/[0.1]"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.06] ${k.tone}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {k.label}
                    </p>
                    <p className="truncate text-lg font-semibold text-white">
                      {k.value}
                    </p>
                    <p className="truncate text-xs text-slate-500">{k.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card glow className="md:col-span-2 xl:col-span-1">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-5 w-5 text-cyan-400" />
                    Identity status
                  </CardTitle>
                  <CardDescription>Enrollment and identity vault</CardDescription>
                </div>
                <Badge variant={selectedIdentity ? 'success' : 'muted'}>
                  {selectedIdentity ? 'Secured' : 'Not enrolled'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedIdentity ? (
                  <>
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500">Name:</span>{' '}
                      <span className="font-medium text-white">
                        {selectedIdentity.name}
                      </span>
                    </p>
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500">Email:</span>{' '}
                      <span className="font-medium text-white">
                        {selectedIdentity.email}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Registered{' '}
                      {new Date(selectedIdentity.created_at).toLocaleString()}
                    </p>
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                      <Fingerprint className="h-4 w-4" />
                      Identity Secured
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">
                    Register face and voice to unlock matching scores and legal
                    bundles.
                  </p>
                )}
                <Button
                  variant="glass"
                  size="sm"
                  className="mt-2 rounded-xl"
                  asChild
                >
                  <Link to={selectedIdentity ? '/app/enrollments' : '/app/register'}>
                    {selectedIdentity ? 'View enrollments' : 'Register identity'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-violet-400" />
                  Authenticity score
                </CardTitle>
                <CardDescription>
                  Combined analysis output
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {authenticity != null && level ? (
                  <>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold tabular-nums text-white">
                        {authenticity}%
                      </span>
                      <Badge
                        variant={
                          level === 'High'
                            ? 'success'
                            : level === 'Medium'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {level}
                      </Badge>
                    </div>
                    <Progress value={authenticity} />
                    <p className="text-xs text-slate-500">
                      Last scan:{' '}
                      {lastAnalysis?.created_at
                        ? new Date(lastAnalysis.created_at).toLocaleString()
                        : 'N/A'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">
                    Run a deepfake analysis to compute your authenticity index.
                  </p>
                )}
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <Link to="/app/deepfake">New scan</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-amber-300" />
                  Quick actions
                </CardTitle>
                <CardDescription>Common workflows</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="glass" size="sm" className="rounded-xl" asChild>
                  <Link
                    to={
                      lastAnalysis
                        ? `/app/results/${lastAnalysis.id}`
                        : '/app/results'
                    }
                  >
                    View match breakdown
                  </Link>
                </Button>
                <Button variant="glass" size="sm" className="rounded-xl" asChild>
                  <Link to="/app/legal">Generate legal proof</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={triggerDemoAlert}>
                  Simulate security alert
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent scans</CardTitle>
              <CardDescription>Latest deepfake analyses</CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length > 0 ? (
                <div className="space-y-3">
                  {analyses.slice(0, 5).map((a) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">
                          Analysis {a.id.slice(0, 8)}…
                        </p>
                        <p className="text-sm text-slate-400">
                          {a.is_deepfake ? (
                            <span className="text-amber-300">
                              Elevated manipulation signals
                            </span>
                          ) : (
                            <span className="text-emerald-300">
                              Consistent with authentic capture
                            </span>
                          )}{' '}
                          · {a.deepfake_score}% deepfake score
                          {a.created_at && (
                            <span className="text-slate-500">
                              {' '}· {new Date(a.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <Button variant="glass" size="sm" className="rounded-xl" asChild>
                        <Link to={`/app/results/${a.id}`}>View</Link>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No scans yet. Upload media on the Deepfake Scan page.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                Understanding your scores
              </CardTitle>
              <CardDescription>
                How to interpret PersonaShield AI analysis results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                'High authenticity usually means stable face and voice alignment with your enrollment.',
                'Elevated deepfake risk indicates potential synthetic manipulation detected by AI models.',
                'Export a legal PDF after a scan to create evidence-ready documentation.',
                'Use the AI Legal assistant for draft language guidance, not as legal advice.',
              ].map((line, i) => (
                <div key={line}>
                  {i > 0 ? <Separator className="my-4 bg-white/[0.06]" /> : null}
                  <p className="text-sm leading-relaxed text-slate-300">{line}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
