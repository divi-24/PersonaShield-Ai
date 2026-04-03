import { motion } from 'framer-motion'
import { Brain, Download, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppState } from '@/context/AppStateContext'
import { getAnalysis, resolveReportUrl } from '@/lib/api/client'
import type { Analysis } from '@/lib/api/types'

function authenticityLevel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 75) return 'High'
  if (score >= 45) return 'Medium'
  return 'Low'
}

export function ResultsPage() {
  const { analysisId } = useParams<{ analysisId?: string }>()
  const { getToken } = useAuth()
  const { lastAnalysis, analyses } = useAppState()
  const [remote, setRemote] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(!!analysisId)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!analysisId) {
      setRemote(null)
      setLoading(false)
      setFetchError(null)
      return
    }
    setLoading(true)
    setFetchError(null)
    try {
      const token = await getToken()
      const data = await getAnalysis(analysisId, token ?? undefined)
      setRemote(data)
    } catch (e) {
      setRemote(null)
      setFetchError(e instanceof Error ? e.message : 'Could not load analysis')
    } finally {
      setLoading(false)
    }
  }, [analysisId, getToken])

  useEffect(() => {
    void load()
  }, [load])

  const fromList = analysisId ? analyses.find((a) => a.id === analysisId) : undefined
  const analysis: Analysis | null | undefined = analysisId
    ? remote ?? fromList ?? null
    : lastAnalysis

  if (loading && analysisId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <p className="text-sm text-slate-500">Loading scan details…</p>
      </div>
    )
  }

  if (analysisId && fetchError && !analysis) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <PageHeader eyebrow="Analysis" title="Scan not found" description={fetchError} />
        <Button className="rounded-xl" asChild>
          <Link to="/app/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-lg space-y-8">
        <PageHeader
          eyebrow="Analysis"
          title="Match & scores"
          description="Run a deepfake scan to see detection results, face and voice matching scores."
        />
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
          <Brain className="mx-auto h-12 w-12 text-slate-600" />
          <h2 className="mt-4 text-lg font-semibold text-white">No results yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Upload media on the Deepfake Scan page to see analysis results.
          </p>
          <Button className="mt-6 rounded-xl" asChild>
            <Link to="/app/deepfake">Go to Deepfake Scan</Link>
          </Button>
        </div>
      </div>
    )
  }

  const {
    is_deepfake,
    deepfake_score,
    face_match_score,
    voice_match_score,
    authenticity_score,
    explanation,
    report_url,
    created_at,
    id,
  } = analysis

  const level = authenticityLevel(authenticity_score)
  const levelVariant =
    level === 'High' ? 'success' : level === 'Medium' ? 'warning' : 'danger'
  const resolvedReportUrl = resolveReportUrl(report_url)

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        eyebrow="Analysis"
        title="Match & scores"
        description={
          analysisId
            ? `Scan ${id.slice(0, 8)}… — full signal breakdown`
            : 'AI-powered analysis results'
        }
        badges={
          <>
            <Badge variant={is_deepfake ? 'danger' : 'success'} className="rounded-lg">
              {is_deepfake ? 'Likely synthetic' : 'Likely authentic'}
            </Badge>
            <Badge variant="muted" className="rounded-lg font-normal">
              Deepfake score: {deepfake_score}%
            </Badge>
          </>
        }
      />

      <Tabs defaultValue="summary">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="biometrics">Biometrics</TabsTrigger>
          <TabsTrigger value="explanation">AI Explanation</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 backdrop-blur-xl"
          >
            <div className="flex items-start gap-4">
              {is_deepfake ? (
                <ShieldAlert className="h-10 w-10 shrink-0 text-amber-400" />
              ) : (
                <ShieldCheck className="h-10 w-10 shrink-0 text-emerald-400" />
              )}
              <div>
                <p className="text-lg font-semibold text-white">
                  {is_deepfake
                    ? 'Elevated manipulation signals detected'
                    : 'Content appears authentic'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Deepfake detection confidence: {deepfake_score}%
                </p>
              </div>
            </div>
          </motion.div>

          <Card glow>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-violet-400" />
                Deepfake risk score
              </CardTitle>
              <CardDescription>Higher values indicate more suspicious content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold tabular-nums text-white">
                {deepfake_score}%
              </p>
              <Progress
                value={deepfake_score}
                indicatorClassName={
                  deepfake_score > 50
                    ? 'bg-gradient-to-r from-amber-400 to-red-500'
                    : undefined
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authenticity score</CardTitle>
              <CardDescription>Combined index from all analysis signals</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-4xl font-bold tabular-nums text-white">
                  {authenticity_score}%
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-500">Rating:</span>
                  <Badge variant={levelVariant}>{level}</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="glass" className="rounded-xl" asChild>
                  <Link to="/app/legal">Generate legal proof</Link>
                </Button>
                {resolvedReportUrl && (
                  <Button variant="outline" className="rounded-xl" asChild>
                    <a href={resolvedReportUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download PDF report
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {created_at && (
            <p className="text-center text-xs text-slate-600">
              Analyzed {new Date(created_at).toLocaleString()}
            </p>
          )}
        </TabsContent>

        <TabsContent value="biometrics" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Face match</CardTitle>
                <CardDescription>vs. enrolled reference</CardDescription>
              </CardHeader>
              <CardContent>
                {face_match_score != null ? (
                  <>
                    <p className="text-3xl font-bold tabular-nums text-white">
                      {face_match_score}%
                    </p>
                    <Progress value={face_match_score} className="mt-3" />
                  </>
                ) : (
                  <p className="text-sm text-slate-400">
                    Not available : no identity was selected or media type doesn&apos;t support face
                    matching.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Voice match</CardTitle>
                <CardDescription>Prosody and timbre analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {voice_match_score != null ? (
                  <>
                    <p className="text-3xl font-bold tabular-nums text-white">
                      {voice_match_score}%
                    </p>
                    <Progress value={voice_match_score} className="mt-3" />
                  </>
                ) : (
                  <p className="text-sm text-slate-400">
                    Not available : no identity was selected or media type doesn&apos;t support voice
                    matching.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="explanation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-violet-400" />
                AI Analysis Explanation
              </CardTitle>
              <CardDescription>Generated by PersonaShield AI</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                {explanation}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
