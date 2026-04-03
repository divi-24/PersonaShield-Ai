import { CheckCircle2, CreditCard, Download, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createMarketplaceTransaction, getMarketplaceListing, resolveReportUrl } from '@/lib/api/client'
import type { MarketplacePlatform } from '@/lib/marketplace'
import { apiListingToListing, getListingById, type Listing } from '@/lib/marketplace'
import { buildConsentCertificatePdf } from '@/lib/consentPdf'

const platforms: MarketplacePlatform[] = ['Instagram', 'YouTube', 'TikTok', 'X', 'LinkedIn', 'Website', 'Other']

export function MarketplaceCheckoutPage() {
  const { getToken } = useAuth()
  const { listingId } = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [buyerName, setBuyerName] = useState('Demo Buyer')
  const [buyerEmail, setBuyerEmail] = useState('buyer@demo.com')
  const [platform, setPlatform] = useState<MarketplacePlatform>('Instagram')
  const [intendedUse, setIntendedUse] = useState('UGC brand ad with explicit consent and audit log.')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [paid, setPaid] = useState(false)
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null)

  const txId = useMemo(() => `PS-${Math.random().toString(16).slice(2, 10).toUpperCase()}`, [])

  useEffect(() => {
    if (!listingId) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const row = await getMarketplaceListing(listingId)
        if (cancelled) return
        setListing(apiListingToListing(row))
      } catch {
        const fallback = getListingById(listingId)
        if (cancelled) return
        if (fallback) setListing(fallback)
        else setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [listingId])

  if (!listingId) return <Navigate to="/app/marketplace" replace />
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    )
  }
  if (notFound || !listing) return <Navigate to="/app/marketplace" replace />

  const downloadConsent = () => {
    const doc = buildConsentCertificatePdf({
      listing,
      buyerName: buyerName.trim() || 'Buyer',
      buyerEmail: buyerEmail.trim() || 'buyer@example.com',
      platform,
      intendedUse: intendedUse.trim() || 'Authorized synthetic usage',
      referenceUrl: referenceUrl.trim() || undefined,
      amountInr: listing.pricing.amount,
      transactionId: txId,
    })
    doc.save(`PersonaShield-Consent-Certificate-${listing.handle}-${Date.now()}.pdf`)
  }

  const payNow = async () => {
    try {
      const token = await getToken()
      const tx = await createMarketplaceTransaction({
        listingId: listing.id,
        buyerName: buyerName.trim() || 'Buyer',
        buyerEmail: buyerEmail.trim() || 'buyer@example.com',
        platform,
        intendedUse: intendedUse.trim() || 'Authorized synthetic usage',
        referenceUrl: referenceUrl.trim() || undefined,
        amountInr: listing.pricing.amount,
        token: token ?? undefined,
      })
      setPaid(true)
      setCertificateUrl(resolveReportUrl(tx.certificate_url ?? null))
    } catch {
      setPaid(true)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Marketplace"
        title="Checkout"
        description="Simulated payment UI for demo. Generates consent & licensing certificate."
        badges={
          <>
            <Badge variant="muted" className="rounded-lg font-normal">
              Listing: <span className="ml-1 text-slate-200">{listing.displayName}</span>
            </Badge>
            <Badge variant="muted" className="rounded-lg font-normal">
              Amount: <span className="ml-1 text-slate-200">₹{listing.pricing.amount.toLocaleString('en-IN')}</span>
            </Badge>
          </>
        }
        action={
          <Button variant="glass" className="rounded-xl" asChild>
            <Link to={`/app/marketplace/${listing.id}`}>Back to listing</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-cyan-300" />
              Payment details (mock)
            </CardTitle>
            <CardDescription>No real payments are processed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Buyer name</p>
                <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Buyer email</p>
                <Input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
              </div>
            </div>

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
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reference URL (optional)</p>
                <Input value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} placeholder="https://…" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Intended use</p>
              <textarea
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-3 py-2 text-sm text-white outline-none ring-offset-2 ring-offset-[#030712] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400/50"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Order summary</p>
                  <p className="mt-1 text-xs text-slate-500">Transaction ID: {txId}</p>
                </div>
                <Badge variant="muted" className="rounded-lg font-normal">
                  ₹{listing.pricing.amount.toLocaleString('en-IN')}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-400">
                <p>Assets: {listing.assets}</p>
                <p>Term: {listing.usage.termDays} days</p>
                <p>Territory: {listing.usage.territory}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl" onClick={() => void payNow()} disabled={paid}>
                {paid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Paid (demo)
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Pay now (demo)
                  </>
                )}
              </Button>
              <Button variant="glass" className="rounded-xl" onClick={downloadConsent} disabled={!paid}>
                <Download className="h-4 w-4" />
                Download consent certificate
              </Button>
              {certificateUrl ? (
                <Button variant="outline" className="rounded-xl" asChild>
                  <a href={certificateUrl} target="_blank" rel="noreferrer">
                    Server certificate record
                  </a>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card glow className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Compliance checklist
            </CardTitle>
            <CardDescription>What this flow protects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p className="rounded-2xl border border-white/10 bg-white/4 p-4">
              This creates a consent-backed licensing record so synthetic usage is authorized , reducing deepfake abuse claims.
            </p>
            <ul className="space-y-2">
              {[
                'Consent certificate PDF for platform disputes',
                'Defined term, territory, and allowed platforms',
                'Prohibited categories to prevent misuse',
                'Audit-friendly transaction identifier',
              ].map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
                  {x}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link to="/app/misuse">Report misuse instead</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

