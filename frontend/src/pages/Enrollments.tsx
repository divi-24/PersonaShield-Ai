import { motion } from 'framer-motion'
import { Fingerprint, Loader2, Mic, User } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
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
import { useAppState } from '@/context/AppStateContext'
import { getIdentityDetail } from '@/lib/api/client'
import type { IdentityDetail } from '@/lib/api/types'

export function EnrollmentsPage() {
  const { identities, loading: appLoading } = useAppState()
  const { getToken } = useAuth()
  const [details, setDetails] = useState<Record<string, IdentityDetail>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (appLoading) return
      if (identities.length === 0) {
        setDetails({})
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const token = await getToken()
        const rows = await Promise.all(
          identities.map((i) => getIdentityDetail(i.id, token ?? undefined))
        )
        if (cancelled) return
        const map: Record<string, IdentityDetail> = {}
        for (const d of rows) map[d.id] = d
        setDetails(map)
      } catch {
        if (!cancelled) setDetails({})
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [appLoading, getToken, identities])

  if (appLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Identity vault"
        title="All enrollments"
        description="Every registered identity for your account, with biometric enrollment status and recent scan activity."
        badges={
          <>
            <Badge variant="muted" className="rounded-lg font-normal">
              {identities.length} {identities.length === 1 ? 'profile' : 'profiles'}
            </Badge>
          </>
        }
        action={
          <Button className="rounded-xl" asChild>
            <Link to="/app/register">Add enrollment</Link>
          </Button>
        }
      />

      {identities.length === 0 ? (
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="py-12 text-center">
            <Fingerprint className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-4 text-sm text-slate-400">
              No identities yet. Register face and voice to enable matching and legal bundles.
            </p>
            <Button className="mt-6 rounded-xl" asChild>
              <Link to="/app/register">Register identity</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {identities.map((identity, index) => {
            const d = details[identity.id]
            return (
              <motion.div
                key={identity.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full border-white/10 bg-linear-to-b from-white/[0.05] to-transparent">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 ring-1 ring-white/10">
                          <User className="h-5 w-5 text-cyan-300" />
                        </span>
                        <div>
                          <CardTitle className="text-lg">{identity.name}</CardTitle>
                          <CardDescription>{identity.email}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="success" className="rounded-lg">
                        Enrolled
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Face embedding
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
                          <Fingerprint className="h-4 w-4 text-violet-300" />
                          {d?.has_face_embedding ?? identity.has_face_embedding ? 'Ready' : 'Missing'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Voice embedding
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
                          <Mic className="h-4 w-4 text-cyan-300" />
                          {d?.has_voice_embedding ?? identity.has_voice_embedding ? 'Ready' : 'Missing'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-slate-400">
                      <p>
                        <span className="text-slate-500">Registered:</span>{' '}
                        {new Date(identity.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1">
                        <span className="text-slate-500">Total scans against this identity:</span>{' '}
                        <span className="font-medium text-slate-200">
                          {d?.analysis_count ?? identity.analysis_count ?? 0}
                        </span>
                      </p>
                      {d?.last_scan_at ? (
                        <p className="mt-1">
                          <span className="text-slate-500">Last scan:</span>{' '}
                          {new Date(d.last_scan_at).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    {d && d.recent_scans.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Recent scans
                        </p>
                        <ul className="mt-2 space-y-2">
                          {d.recent_scans.map((s) => (
                            <li
                              key={s.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
                            >
                              <span className="text-slate-300">
                                {s.is_deepfake ? (
                                  <span className="text-amber-300">Elevated risk</span>
                                ) : (
                                  <span className="text-emerald-300">Likely authentic</span>
                                )}{' '}
                                · {s.deepfake_score.toFixed(0)}%
                              </span>
                              <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                                <Link to={`/app/results/${s.id}`}>Open</Link>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No scans have been matched to this identity yet.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button variant="glass" size="sm" className="rounded-xl" asChild>
                        <Link to="/app/deepfake">New scan</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl" asChild>
                        <Link to="/app/results">Latest results</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
