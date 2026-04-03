import { motion } from 'framer-motion'
import {
  ArrowRight,
  FileText,
  Link2,
  Loader2,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { chatLegalAssistant, createMisuseReport, createNoticeLog, getMisuseReports } from '@/lib/api/client'
import type { MisuseReport } from '@/lib/api/types'
import type { MarketplacePlatform } from '@/lib/marketplace'
import { useAppState } from '@/context/AppStateContext'

const platforms: MarketplacePlatform[] = ['Instagram', 'YouTube', 'TikTok', 'X', 'LinkedIn', 'Website', 'Other']

function docPrompt(platform: MarketplacePlatform, url: string, evidence: string) {
  const u = url.trim() ? `URL: ${url.trim()}` : 'URL: [PASTE URL]'
  const ev = evidence.trim() ? evidence.trim() : '[EVIDENCE SUMMARY]'
  return `I found misuse on ${platform}.\n${u}\nEvidence: ${ev}\n\nPlease draft the document.`
}

export function MisuseReportPage() {
  const { getToken } = useAuth()
  const { lastAnalysis, selectedIdentity } = useAppState()
  const [platform, setPlatform] = useState<MarketplacePlatform>('Instagram')
  const [url, setUrl] = useState('')
  const [evidence, setEvidence] = useState('Screenshot links, timestamps, account handle, and preserved URLs.')
  const [responding, setResponding] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [draftType, setDraftType] = useState<'notice' | 'dmca' | 'fir' | null>(null)
  const [reports, setReports] = useState<MisuseReport[]>([])

  const hasContext = useMemo(() => !!lastAnalysis || !!selectedIdentity, [lastAnalysis, selectedIdentity])

  const refreshReports = useCallback(async () => {
    const token = await getToken()
    const rows = await getMisuseReports(token ?? undefined)
    setReports(rows)
  }, [getToken])

  useEffect(() => {
    void refreshReports().catch(() => setReports([]))
  }, [refreshReports])

  const generate = async (type: 'notice' | 'dmca' | 'fir') => {
    setResponding(true)
    setDraft(null)
    setDraftType(type)
    try {
      const res = await chatLegalAssistant({
        messages: [
          {
            role: 'user',
            content: docPrompt(platform, url, evidence),
          },
        ],
        analysisId: lastAnalysis?.id,
        identityId: selectedIdentity?.id,
        documentType: type,
        token: (await getToken()) ?? undefined,
      })
      setDraft(res.reply)
      const token = await getToken()
      await createNoticeLog({
        targetType: 'external',
        targetValue: platform,
        platform,
        contentUrl: url || undefined,
        evidenceSummary: evidence || undefined,
        documentType: type,
        message: res.reply,
        status: 'drafted',
        token: token ?? undefined,
      })
      await createMisuseReport({
        platform,
        contentUrl: url || undefined,
        evidenceSummary: evidence || undefined,
        reportType: type,
        description: res.reply.slice(0, 8000),
        token: token ?? undefined,
      })
      await refreshReports()
    } catch {
      setDraft('Failed to generate draft. Please try again.')
    } finally {
      setResponding(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Legal"
        title="Misuse report & enforcement"
        description="Generate external notices and platform reports even if the abuser is not on PersonaShield."
        badges={
          <>
            <Badge variant="muted" className="rounded-lg font-normal">
              Platform-aware drafts
            </Badge>
            <Badge variant="muted" className="rounded-lg font-normal">
              Evidence-first
            </Badge>
            <Badge variant={hasContext ? 'success' : 'warning'} className="rounded-lg font-normal">
              {hasContext ? 'Scan context linked' : 'No scan context'}
            </Badge>
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" className="rounded-xl" asChild>
              <Link to="/app/assistant">AI Legal</Link>
            </Button>
            <Button className="rounded-xl" asChild>
              <Link to="/app/marketplace">
                License instead <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
              Where did you find the misuse?
            </CardTitle>
            <CardDescription>Select platform and attach evidence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform</p>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as MarketplacePlatform)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/4 px-3 text-sm text-white outline-none ring-offset-2 ring-offset-[#030712] focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p} className="bg-[#030712]">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Content URL</p>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste link…" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence summary</p>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-3 py-2 text-sm text-white outline-none ring-offset-2 ring-offset-[#030712] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400/50"
              />
              <p className="text-xs text-slate-500">
                Include screenshot links, account handles, timestamps, and where you stored originals.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl" onClick={() => void generate('notice')} disabled={responding}>
                {responding && draftType === 'notice' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
                Legal notice
              </Button>
              <Button variant="glass" className="rounded-xl" onClick={() => void generate('dmca')} disabled={responding}>
                {responding && draftType === 'dmca' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                DMCA-style takedown
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => void generate('fir')} disabled={responding}>
                {responding && draftType === 'fir' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                FIR draft
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card glow className="min-h-[420px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Draft output
            </CardTitle>
            <CardDescription>Download/copy and submit externally</CardDescription>
          </CardHeader>
          <CardContent>
            {draft ? (
              <motion.pre
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-h-[420px] whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/4 p-4 font-sans text-sm leading-relaxed text-slate-200"
              >
                {draft}
              </motion.pre>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/2 p-8 text-center">
                <p className="text-sm font-semibold text-white">No draft yet</p>
                <p className="mt-2 text-sm text-slate-500">
                  Pick a platform and generate a notice, takedown, or FIR draft.
                </p>
                <Button variant="glass" className="mt-5 rounded-xl" asChild>
                  <Link to="/app/legal">Open proof generator</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/2">
        <CardHeader>
          <CardTitle className="text-base">Submitted misuse reports</CardTitle>
          <CardDescription>Stored enforcement drafts for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">No reports stored yet.</p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-slate-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-white">{r.platform}</span>
                    <Badge variant="muted" className="rounded-lg font-normal">
                      {r.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-slate-400">{r.description}</p>
                  <p className="mt-2 text-xs text-slate-600">{new Date(r.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

