import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Copy, FileText, Loader2, Scale, Send, Shield, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { chatLegalAssistant } from '@/lib/api/client'
import { useAppState } from '@/context/AppStateContext'
import { cn } from '@/lib/utils'

type Msg = { id: string; role: 'user' | 'assistant'; text: string }

const quickPrompts = [
  {
    key: 'fir',
    label: 'Generate FIR draft',
    sub: 'Police complaint format for cyber/deepfake impersonation.',
    icon: Shield,
    text: 'Generate an FIR draft for identity impersonation using deepfake video.',
  },
  {
    key: 'notice',
    label: 'Create legal notice',
    sub: 'Cease & desist / platform notice with timeline and demands.',
    icon: Scale,
    text: 'Create a legal notice to a platform hosting synthetic likeness of me.',
  },
  {
    key: 'complaint',
    label: 'Civil complaint outline',
    sub: 'Court-ready structure: jurisdiction, causes of action, relief.',
    icon: FileText,
    text: 'Outline a civil complaint for damages from deepfake misuse.',
  },
  {
    key: 'dmca',
    label: 'DMCA-style takedown',
    sub: 'A structured takedown notice with required statements.',
    icon: Copy,
    text: 'Draft a DMCA-style takedown request for unauthorized synthetic media.',
  },
] as const

export function LegalAssistantPage() {
  const { getToken } = useAuth()
  const { lastAnalysis, selectedIdentity } = useAppState()
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'PersonaShield Legal Assistant. Choose a shortcut or type a question about deepfake-related legal matters. Note: This is not legal advice.',
    },
  ])
  const [input, setInput] = useState('')
  const [responding, setResponding] = useState(false)
  const [typingForId, setTypingForId] = useState<string | null>(null)
  const [copiedForId, setCopiedForId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollDown()
  }, [messages, typingForId, scrollDown])

  const sendAndGetReply = useCallback(async (userText: string, documentType?: string) => {
    const userId = crypto.randomUUID()
    const userMsg: Msg = { id: userId, role: 'user', text: userText }

    setMessages((m) => [...m, userMsg])
    setResponding(true)

    try {
      const allMessages = [...messages, userMsg]
      const apiMessages = allMessages
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.text }))

      const response = await chatLegalAssistant({
        messages: apiMessages,
        analysisId: lastAnalysis?.id,
        identityId: selectedIdentity?.id,
        documentType,
        token: (await getToken()) ?? undefined,
      })

      const assistantId = crypto.randomUUID()
      setMessages((m) => [
        ...m,
        { id: assistantId, role: 'assistant', text: response.reply },
      ])
      setTypingForId(assistantId)
    } catch {
      const errorId = crypto.randomUUID()
      setMessages((m) => [
        ...m,
        {
          id: errorId,
          role: 'assistant',
          text: 'Sorry, I encountered an error processing your request. Please try again.',
        },
      ])
    } finally {
      setResponding(false)
    }
  }, [messages, lastAnalysis, selectedIdentity, getToken])

  const onPrompt = (text: string, documentType?: string) => {
    if (responding) return
    void sendAndGetReply(text, documentType)
  }

  const handleTypingComplete = useCallback(() => {
    setTypingForId(null)
  }, [])

  const copyMessage = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedForId(id)
      window.setTimeout(() => setCopiedForId((cur) => (cur === id ? null : cur)), 900)
    } catch {
      // clipboard may be blocked; ignore
    }
  }, [])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const t = input.trim()
    if (!t || responding) return
    setInput('')
    void sendAndGetReply(t)
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <PageHeader
        eyebrow="Legal"
        title="AI legal assistant"
        description="Get AI-powered guidance on deepfake-related legal matters."
        badges={
          <>
            <Badge variant="muted" className="rounded-lg font-normal">
              Not legal advice
            </Badge>
            {selectedIdentity ? (
              <Badge variant="muted" className="rounded-lg font-normal">
                Identity: <span className="ml-1 text-slate-200">{selectedIdentity.name}</span>
              </Badge>
            ) : (
              <Badge variant="muted" className="rounded-lg font-normal">
                No identity selected
              </Badge>
            )}
            {lastAnalysis ? (
              <Badge variant="muted" className="rounded-lg font-normal">
                Last scan: <span className="ml-1 text-slate-200">{lastAnalysis.deepfake_score}%</span>
              </Badge>
            ) : (
              <Badge variant="muted" className="rounded-lg font-normal">
                No scan loaded
              </Badge>
            )}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {quickPrompts.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={responding}
            onClick={() => onPrompt(p.text, p.key)}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-xl transition',
              'hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.03] hover:shadow-[0_20px_70px_-32px_rgba(0,0,0,0.9)]',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            <div className="absolute -inset-16 bg-[radial-gradient(circle_at_35%_20%,rgba(34,211,238,0.16),transparent_55%),radial-gradient(circle_at_85%_30%,rgba(167,139,250,0.14),transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-200 ring-1 ring-white/[0.04] transition group-hover:border-cyan-400/25 group-hover:bg-cyan-500/10">
                <p.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{p.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{p.sub}</p>
              </div>
              <span className="ml-auto mt-1 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {p.key}
              </span>
            </div>
          </button>
        ))}
      </div>

      <Card className="flex min-h-[520px] flex-col overflow-hidden border-white/10 bg-slate-900/35">
        <CardHeader className="border-b border-white/10 bg-white/[0.02] py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5 text-cyan-400" />
                Secure legal drafting
                {responding && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin text-cyan-400" />
                )}
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Drafts are generated from your scan context and must be reviewed before use.
              </p>
            </div>
            <Badge variant="muted" className="mt-0.5 rounded-lg font-normal">
              Encrypted session (demo)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-0 overflow-hidden p-0">
          <ScrollArea className="h-[520px] max-h-[65vh]">
            <div className="space-y-3 p-5 pr-4">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    msg={m}
                    animateTyping={m.id === typingForId}
                    onTypingComplete={handleTypingComplete}
                    onCopy={copyMessage}
                    copied={copiedForId === m.id}
                  />
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          <form
            onSubmit={onSubmit}
            className="flex gap-2 border-t border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about FIR wording, evidence list, takedowns, or platform escalation…"
              className="flex-1 rounded-xl border-white/10 bg-white/[0.04] focus-visible:ring-cyan-400/50"
              disabled={responding}
            />
            <Button type="submit" size="icon" variant="default" disabled={responding} className="rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function MessageBubble({
  msg,
  animateTyping,
  onTypingComplete,
  onCopy,
  copied,
}: {
  msg: Msg
  animateTyping: boolean
  onTypingComplete: () => void
  onCopy: (id: string, text: string) => void
  copied: boolean
}) {
  const isUser = msg.role === 'user'
  const full = msg.text
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (isUser || !animateTyping) return
    let i = 0
    const interval = window.setInterval(() => {
      i += Math.min(5, full.length - i)
      setTyped(full.slice(0, i))
      if (i >= full.length) {
        clearInterval(interval)
        onTypingComplete()
      }
    }, 22)
    return () => clearInterval(interval)
  }, [isUser, animateTyping, full, onTypingComplete])

  const display = isUser ? full : animateTyping ? typed : full

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
          <Bot className="h-4 w-4 text-cyan-300" />
        </span>
      )}
      <div className={cn('max-w-[86%]', !isUser && 'group relative')}>
        {!isUser ? (
          <div className="absolute -right-1 -top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onCopy(msg.id, full)}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#030712]/70 text-slate-300 shadow-lg shadow-black/40 backdrop-blur-xl transition',
                    'hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
                  )}
                  aria-label="Copy message"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{copied ? 'Copied' : 'Copy'}</TooltipContent>
            </Tooltip>
          </div>
        ) : null}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]',
            isUser
              ? 'bg-gradient-to-br from-violet-600/95 to-cyan-600/95 text-white shadow-[0_18px_50px_-28px_rgba(34,211,238,0.65)]'
              : 'border border-white/10 bg-white/[0.04] text-slate-200 backdrop-blur-xl'
          )}
        >
          {isUser ? (
            <span className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
              {msg.text}
            </span>
          ) : (
            <pre className="whitespace-pre-wrap font-sans">{display}</pre>
          )}
        </div>
      </div>
    </motion.div>
  )
}
