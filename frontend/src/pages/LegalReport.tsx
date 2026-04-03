import { motion } from 'framer-motion'
import { Download, FileText, Printer } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAppState } from '@/context/AppStateContext'
import { resolveReportUrl } from '@/lib/api/client'
import { buildLegalReportPdf } from '@/lib/legalPdf'

export function LegalReportPage() {
  const { selectedIdentity, lastAnalysis } = useAppState()
  const [generated, setGenerated] = useState(false)

  const resolvedReportUrl = lastAnalysis ? resolveReportUrl(lastAnalysis.report_url) : null

  const downloadClientPdf = () => {
    const doc = buildLegalReportPdf(selectedIdentity, lastAnalysis)
    doc.save(`PersonaShield-Legal-Proof-${Date.now()}.pdf`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 print:max-w-none">
      <PageHeader
        className="print:hidden"
        eyebrow="Legal"
        title="Legal proof generator"
        description="Generate and download authenticity certificates and forensic reports."
        badges={
          <Badge variant="muted" className="rounded-lg font-normal">
            PDF export
          </Badge>
        }
      />

      <div className="flex flex-wrap gap-2 print:hidden">
        {resolvedReportUrl && (
          <Button size="lg" asChild>
            <a href={resolvedReportUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Download analysis report
            </a>
          </Button>
        )}
        <Button
          size="lg"
          variant={resolvedReportUrl ? 'glass' : 'default'}
          onClick={() => {
            setGenerated(true)
            downloadClientPdf()
          }}
        >
          <FileText className="h-4 w-4" />
          Generate branded certificate
        </Button>
        <Button size="lg" variant="glass" onClick={() => setGenerated(true)}>
          Preview bundle
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Print view
        </Button>
      </div>

      <motion.div
        initial={false}
        animate={
          generated || lastAnalysis
            ? { opacity: 1, y: 0 }
            : { opacity: 0.9, y: 2 }
        }
        className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl print:border-slate-300 print:bg-white print:shadow-none"
      >
        <Card className="border-white/10 bg-white/[0.03] print:border-slate-200 print:bg-white">
          <CardHeader className="border-b border-white/10 print:border-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-white print:text-slate-900">
                  PersonaShield AI: Legal authenticity certificate
                </CardTitle>
                <CardDescription className="print:text-slate-600">
                  Forensic analysis document
                </CardDescription>
              </div>
              <Badge variant="muted" className="print:border-slate-300">
                {lastAnalysis ? (lastAnalysis.is_deepfake ? 'Suspicious' : 'Authentic') : 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <section>
              <h3 className="text-sm font-semibold text-cyan-300 print:text-cyan-800">
                Subject
              </h3>
              <p className="mt-1 text-white print:text-slate-900">
                {selectedIdentity?.name ?? 'N/A (register on Identity page)'}
              </p>
              {selectedIdentity?.email && (
                <p className="text-xs text-slate-400 print:text-slate-600">
                  {selectedIdentity.email}
                </p>
              )}
              <p className="text-xs text-slate-500 print:text-slate-600">
                Registered:{' '}
                {selectedIdentity?.created_at
                  ? new Date(selectedIdentity.created_at).toLocaleString()
                  : 'N/A'}
              </p>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-violet-300 print:text-violet-900">
                Analysis summary
              </h3>
              {lastAnalysis ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-300 print:text-slate-800">
                  <li>
                    Verdict:{' '}
                    {lastAnalysis.is_deepfake
                      ? 'Synthetic / manipulated'
                      : 'Likely authentic'}
                  </li>
                  <li>Deepfake score: {lastAnalysis.deepfake_score}%</li>
                  {lastAnalysis.face_match_score != null && (
                    <li>Face match: {lastAnalysis.face_match_score}%</li>
                  )}
                  {lastAnalysis.voice_match_score != null && (
                    <li>Voice match: {lastAnalysis.voice_match_score}%</li>
                  )}
                  <li>Authenticity: {lastAnalysis.authenticity_score}%</li>
                  {lastAnalysis.created_at && (
                    <li>
                      Timestamp:{' '}
                      {new Date(lastAnalysis.created_at).toLocaleString()}
                    </li>
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500 print:text-slate-600">
                  No analysis data. Run Deepfake Scan first.
                </p>
              )}
            </section>

            {lastAnalysis?.explanation && (
              <section>
                <h3 className="text-sm font-semibold text-amber-300 print:text-amber-800">
                  AI explanation
                </h3>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-300 print:text-slate-800">
                  {lastAnalysis.explanation}
                </pre>
              </section>
            )}

            <div className="rounded-lg border border-dashed border-white/15 p-4 text-xs text-slate-500 print:border-slate-300 print:text-slate-600">
              This document is generated by PersonaShield AI. Consult qualified
              counsel for legally enforceable instruments.
            </div>

            {resolvedReportUrl && (
              <Button
                variant="glass"
                className="w-full print:hidden"
                asChild
              >
                <a href={resolvedReportUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Download PDF report
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
