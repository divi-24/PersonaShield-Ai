import { ArrowLeft, BadgeCheck, Clock, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMarketplaceListing } from '@/lib/api/client'
import { apiListingToListing, getListingById, type Listing } from '@/lib/marketplace'

export function MarketplaceListingPage() {
  const { listingId } = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Marketplace"
        title={listing.displayName}
        description={listing.headline}
        badges={
          <>
            <Badge variant="muted" className="rounded-lg font-normal">
              @{listing.handle}
            </Badge>
            <Badge variant={listing.trust.verified ? 'success' : 'muted'} className="rounded-lg font-normal">
              {listing.trust.verified ? 'Verified' : 'Unverified'}
            </Badge>
            <Badge variant="muted" className="rounded-lg font-normal">
              {listing.assets}
            </Badge>
          </>
        }
        action={
          <Button variant="glass" className="rounded-xl" asChild>
            <Link to="/app/marketplace">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
              Terms & allowed use
            </CardTitle>
            <CardDescription>Consent-based licensing constraints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Duration</p>
                <p className="mt-1 text-lg font-semibold text-white">{listing.usage.termDays} days</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Territory</p>
                <p className="mt-1 text-lg font-semibold text-white">{listing.usage.territory}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Allowed platforms</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {listing.allowedPlatforms.map((p) => (
                  <Badge key={p} variant="muted" className="rounded-lg font-normal">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Allowed use-cases</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {listing.usage.allowedUseCases.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 text-cyan-300" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prohibited</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {listing.usage.prohibitedUseCases.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-red-400/80" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card glow className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Checkout</CardTitle>
            <CardDescription>Simulated payment and consent certificate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Price</p>
              <p className="mt-1 text-3xl font-bold text-white">
                ₹{listing.pricing.amount.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-slate-500">One-time (demo). Platform fee included.</p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 p-4">
                <BadgeCheck className="h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Consent certificate</p>
                  <p className="text-xs text-slate-500">Downloadable proof of authorization</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 p-4">
                <Clock className="h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Response SLA</p>
                  <p className="text-xs text-slate-500">{listing.trust.responseSlaHours} hours</p>
                </div>
              </div>
            </div>

            <Button className="w-full rounded-xl" asChild>
              <Link to={`/app/marketplace/${listing.id}/checkout`}>Proceed to payment</Link>
            </Button>
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link to="/app/assistant">Ask AI Legal about licensing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
