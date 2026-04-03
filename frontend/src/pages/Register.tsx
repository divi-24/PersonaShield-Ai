import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, Mic, Upload, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import { PageHeader } from '@/components/layout/PageHeader'
import { useAppState } from '@/context/AppStateContext'

export function RegisterPage() {
  const { selectedIdentity, registering, error, registerIdentity } = useAppState()
  const [name, setName] = useState(selectedIdentity?.name ?? '')
  const [email, setEmail] = useState(selectedIdentity?.email ?? '')
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [facePreview, setFacePreview] = useState<string | null>(null)
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [voiceName, setVoiceName] = useState<string | null>(null)
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null)
  const [done, setDone] = useState(!!selectedIdentity)

  useEffect(() => {
    return () => {
      if (voiceUrl) URL.revokeObjectURL(voiceUrl)
      if (facePreview && facePreview.startsWith('blob:')) URL.revokeObjectURL(facePreview)
    }
  }, [voiceUrl, facePreview])

  const onFace = useCallback((f: File | null) => {
    if (!f || !f.type.startsWith('image/')) {
      setFaceFile(null)
      setFacePreview(null)
      return
    }
    setFaceFile(f)
    setFacePreview(URL.createObjectURL(f))
  }, [])

  const onVoice = useCallback((f: File | null) => {
    setVoiceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setVoiceFile(null)
    setVoiceName(null)
    if (!f) return
    setVoiceFile(f)
    setVoiceName(f.name)
    setVoiceUrl(URL.createObjectURL(f))
  }, [])

  const submit = async () => {
    if (!name.trim() || !email.trim() || !faceFile || !voiceFile) return
    try {
      await registerIdentity({
        name: name.trim(),
        email: email.trim(),
        faceImage: faceFile,
        voiceAudio: voiceFile,
      })
      setDone(true)
    } catch {
      // error is set in context
    }
  }

  const canSubmit = name.trim() && email.trim() && faceFile && voiceFile && !registering

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        eyebrow="Protect"
        title="Identity registration"
        description="Enroll face and voice references. Your biometric data is processed on the server for identity verification."
        badges={
          <Badge variant="muted" className="rounded-lg font-normal">
            Secure enrollment
          </Badge>
        }
      />

      <Card glow>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-cyan-400" />
            Profile
          </CardTitle>
          <CardDescription>Your identity information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Full name</Label>
            <Input
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-violet-400" />
              Face reference
            </CardTitle>
            <CardDescription>Upload a clear face photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => onFace(e.target.files?.[0] ?? null)}
            />
            <div className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30">
              {facePreview ? (
                <img
                  src={facePreview}
                  alt="Face preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-600">
                  No image
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mic className="h-4 w-4 text-cyan-400" />
              Voice reference
            </CardTitle>
            <CardDescription>Upload a voice recording</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept="audio/*"
              onChange={(e) => onVoice(e.target.files?.[0] ?? null)}
            />
            {voiceName && (
              <p className="truncate text-xs text-slate-400">{voiceName}</p>
            )}
            {voiceUrl ? (
              <audio
                controls
                className="w-full rounded-lg opacity-90"
                src={voiceUrl}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => void submit()}
        disabled={!canSubmit}
      >
        {registering ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registering…
          </>
        ) : (
          'Register identity'
        )}
      </Button>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-100">Identity Secured</p>
                <p className="text-sm text-emerald-200/80">
                  Biometric references have been processed and stored securely.
                </p>
              </div>
              <Badge variant="success" className="ml-auto">
                Enrolled
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
