import { motion } from 'framer-motion'
import { CheckCircle2, Mail, Search, ShieldAlert, Wallet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createDispute, createNoticeLog, getDisputes } from '@/lib/api/client'
import type { Dispute } from '@/lib/api/types'
import { searchDirectory, type DirectoryUser } from '@/lib/directory'

export function DisputesPage() {
  const { getToken } = useAuth()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<DirectoryUser | null>(null)
  const [notice, setNotice] = useState(
    'This is a formal notice that your account appears to be using synthetic media that implicates my identity rights. Please remove the content immediately or proceed to license via PersonaShield.'
  )
  const [sent, setSent] = useState(false)
  const [requestedPayment, setRequestedPayment] = useState(false)
  const [disputes, setDisputes] = useState<Dispute[]>([])

  const results = useMemo(() => searchDirectory(q), [q])

  const refreshDisputes = useCallback(async () => {
    const token = await getToken()
    const rows = await getDisputes(token ?? undefined)
    setDisputes(rows)
  }, [getToken])

  useEffect(() => {
    void refreshDisputes().catch(() => {
      setDisputes([])
    })
  }, [refreshDisputes])

  const send = async () => {
    if (!selected) return
    const token = await getToken()
    await createNoticeLog({
      targetType: 'internal_user',
      targetValue: selected.username,
      documentType: 'internal_notice',
      message: notice,
      status: 'sent',
      token: token ?? undefined,
    })
    await createDispute({
      targetUser: selected.username,
      reason: notice.slice(0, 4000),
      evidenceSummary: `Directory match: ${selected.displayName} (${selected.email})`,
      resolutionSought: 'content_removal',
      token: token ?? undefined,
    })
    await refreshDisputes()
    setSent(true)
    window.setTimeout(() => setSent(false), 1400)
  }

  const requestPayment = async () => {
    if (!selected) return
    const token = await getToken()
    await createNoticeLog({
      targetType: 'internal_user',
      targetValue: selected.username,
      documentType: 'payment_request',
      message: `Settlement/payment requested from ${selected.username}`,
      status: 'requested',
      token: token ?? undefined,
    })
    await createDispute({
      targetUser: selected.username,
      reason: `Settlement requested for misuse involving @${selected.username}`,
      evidenceSummary: selected.email,
      resolutionSought: 'payment_settlement',
      token: token ?? undefined,
    })
    await refreshDisputes()
    setRequestedPayment(true)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Resolution"
        title="Disputes & in-platform notice"
        description="If the abusing user exists on PersonaShield, you can send a notice and request consent/payment (simulated)."
        badges={
          <>
            <Badge variant="muted" className="rounded-lg font-normal">
              Directory search (demo)
            </Badge>
            <Badge variant="muted" className="rounded-lg font-normal">
              Notice + settlement (sim)
            </Badge>
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" className="rounded-xl" asChild>
              <Link to="/app/misuse">External enforcement</Link>
            </Button>
            <Button className="rounded-xl" asChild>
              <Link to="/app/marketplace">Open marketplace</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5 text-cyan-300" />
              Search user
            </CardTitle>
            <CardDescription>Find abuser by username or email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setSelected(null)
              }}
              placeholder="Search username/email…"
            />

            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelected(u)}
                    className="w-full rounded-2xl border border-white/10 bg-white/3 p-4 text-left transition hover:border-white/15 hover:bg-white/4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{u.displayName}</p>
                        <p className="text-sm text-slate-500">@{u.username}</p>
                        <p className="mt-1 text-xs text-slate-500">{u.email}</p>
                      </div>
                      <Badge variant={u.verified ? 'success' : 'muted'} className="rounded-lg font-normal">
                        {u.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/2 p-6 text-sm text-slate-500">
                Search to simulate finding the abusing user on PersonaShield.
              </div>
            )}
          </CardContent>
        </Card>

        <Card glow className="min-h-[420px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
              Send notice / request settlement
            </CardTitle>
            <CardDescription>In-platform delivery (demo)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target</p>
                  <p className="mt-1 text-sm font-semibold text-white">{selected.displayName}</p>
                  <p className="text-xs text-slate-500">@{selected.username}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notice message</p>
                  <textarea
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                    rows={6}
                    className="w-full rounded-2xl border border-white/10 bg-white/4 px-3 py-2 text-sm text-white outline-none ring-offset-2 ring-offset-[#030712] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-xl" onClick={() => void send()}>
                    {sent ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Sent (demo)
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" /> Send notice
                      </>
                    )}
                  </Button>
                  <Button
                    variant="glass"
                    className="rounded-xl"
                    onClick={() => void requestPayment()}
                    disabled={requestedPayment}
                  >
                    <Wallet className="h-4 w-4" />
                    {requestedPayment ? 'Payment requested (demo)' : 'Request payment'}
                  </Button>
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link to="/app/marketplace">Offer license</Link>
                  </Button>
                </div>

                {requestedPayment ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                  >
                    Settlement request created (demo). In production this would open a Stripe checkout or contract flow.
                  </motion.div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/2 p-8 text-center">
                <p className="text-sm font-semibold text-white">Select a user to proceed</p>
                <p className="mt-2 text-sm text-slate-500">
                  If the abuser is not on PersonaShield, use external enforcement instead.
                </p>
                <Button variant="glass" className="mt-5 rounded-xl" asChild>
                  <Link to="/app/misuse">Generate external notice</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/2">
        <CardHeader>
          <CardTitle className="text-base">Your dispute records</CardTitle>
          <CardDescription>Persisted cases tied to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <p className="text-sm text-slate-500">No disputes filed yet.</p>
          ) : (
            <ul className="space-y-3">
              {disputes.map((d) => (
                <li
                  key={d.id}
                  className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-slate-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-white">@{d.target_user}</span>
                    <Badge variant="muted" className="rounded-lg font-normal">
                      {d.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-slate-400">{d.reason}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    {new Date(d.created_at).toLocaleString()} · {d.resolution_sought.replace(/_/g, ' ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

