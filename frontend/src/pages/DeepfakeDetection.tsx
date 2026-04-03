import { motion, AnimatePresence } from 'framer-motion'
import { Film, Image, Loader2, Mic, ScanSearch } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAppState } from '@/context/AppStateContext'
import { cn } from '@/lib/utils'

export function DeepfakeDetectionPage() {
  const navigate = useNavigate()
  const { runAnalysis, analyzing, identities, selectedIdentity, setSelectedIdentityId, error } = useAppState()
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [fileLabel, setFileLabel] = useState('')
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('')
  const [mediaTab, setMediaTab] = useState<'image' | 'video' | 'audio'>('image')
  const [localError, setLocalError] = useState<string | null>(null)

  const onFile = (f: File | null) => {
    setMediaFile(f)
    setFileLabel(f?.name ?? '')
    setLocalError(null)
  }

  const analyze = async () => {
    if (!mediaFile) {
      setLocalError('Please select a media file to analyze.')
      return
    }
    setLocalError(null)
    setProgress(0)
    setPhase('Uploading media…')
    const steps = [
      { p: 20, t: 'Analyzing AI signals…' },
      { p: 45, t: 'Running deepfake detection model…' },
      { p: 65, t: 'Matching biometric references…' },
      { p: 85, t: 'Generating AI explanation…' },
    ]
    let i = 0
    const tick = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i].p)
        setPhase(steps[i].t)
        i++
      }
    }, 800)
    try {
      const result = await runAnalysis({
        mediaFile,
        identityId: selectedIdentity?.id,
      })
      clearInterval(tick)
      setProgress(100)
      setPhase('Analysis complete')
      navigate(`/app/results/${result.id}`)
    } catch {
      clearInterval(tick)
      setProgress(0)
      setPhase('')
      setLocalError(error ?? 'Analysis failed. Please try again.')
    }
  }

  const acceptMap = {
    image: 'image/*',
    video: 'video/*',
    audio: 'audio/*',
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        eyebrow="Protect"
        title="Deepfake detection"
        description="Upload an image, video, or audio file for AI-powered deepfake analysis and identity matching."
        badges={
          <Badge variant="muted" className="rounded-lg font-normal">
            AI analysis
          </Badge>
        }
      />

      <div className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
        {([
          { key: 'image' as const, label: 'Image', icon: Image },
          { key: 'video' as const, label: 'Video', icon: Film },
          { key: 'audio' as const, label: 'Audio', icon: Mic },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMediaTab(key)
              setMediaFile(null)
              setFileLabel('')
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              mediaTab === key
                ? 'bg-white/[0.1] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {identities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Match against identity</CardTitle>
            <CardDescription>
              Select a registered identity for face/voice matching, or skip for deepfake-only analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedIdentity ? 'default' : 'glass'}
                size="sm"
                onClick={() => setSelectedIdentityId(null)}
              >
                None (deepfake only)
              </Button>
              {identities.map((id) => (
                <Button
                  key={id.id}
                  variant={selectedIdentity?.id === id.id ? 'default' : 'glass'}
                  size="sm"
                  onClick={() => setSelectedIdentityId(id.id)}
                >
                  {id.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card glow>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-cyan-400" />
            Media upload
          </CardTitle>
          <CardDescription>
            Select a file to analyze for synthetic manipulation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="media">File</Label>
            <Input
              id="media"
              type="file"
              accept={acceptMap[mediaTab]}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            {fileLabel && (
              <p className="text-xs text-slate-500">
                Selected:{' '}
                <span className="font-mono text-slate-400">{fileLabel}</span>
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="w-full rounded-xl"
            onClick={() => void analyze()}
            disabled={analyzing || !mediaFile}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <ScanSearch className="h-4 w-4" />
                Analyze
              </>
            )}
          </Button>

          {localError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {localError}
            </div>
          )}

          <AnimatePresence>
            {analyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cyan-200/90">{phase}</span>
                  <Badge variant="default">{progress}%</Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
