import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Check, Loader2, Search, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getMarketplaceListings } from '@/lib/api/client'
import { apiListingToListing, demoListings, marketplaceIdentities, type Listing } from '@/lib/marketplace'
import { Input } from '@/components/ui/input'

export function MarketplacePage() {
  const [requested, setRequested] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [listings, setListings] = useState<Listing[]>(demoListings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const rows = await getMarketplaceListings()
        if (cancelled) return
        if (rows.length > 0) {
          setListings(rows.map(apiListingToListing))
        } else {
          setListings(demoListings)
        }
      } catch {
        if (!cancelled) setListings(demoListings)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return listings
    return listings.filter((l) => {
      return (
        l.displayName.toLowerCase().includes(t) ||
        l.handle.toLowerCase().includes(t) ||
        l.category.toLowerCase().includes(t) ||
        l.assets.toLowerCase().includes(t)
      )
    })
  }, [q, listings])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Marketplace"
        title="Consent-based identity licensing"
        description="Convert risky deepfake usage into explicit consent + payment + proof."
        badges={
          <>
            <Badge variant="muted" className="rounded-lg font-normal">
              INR
            </Badge>
            <Badge variant="muted" className="rounded-lg font-normal">
              Proof certificates
            </Badge>
            <Badge variant="muted" className="rounded-lg font-normal">
              Dispute-backed (sim)
            </Badge>
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" className="rounded-xl" asChild>
              <Link to="/app/misuse">Report misuse</Link>
            </Button>
            <Button className="rounded-xl" asChild>
              <Link to="/app/assistant">
                Ask AI Legal <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="border-white/10 bg-white/2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="h-5 w-5 text-cyan-300" />
            Browse listings
          </CardTitle>
          <CardDescription>Search verified creators and brands for licensed face/voice usage</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, handle, category, or asset…"
                className="pl-9"
              />
            </div>
            <Badge variant="muted" className="rounded-lg font-normal">
              {filtered.length} results
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((l, index) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <Card className="flex h-full flex-col border-white/10 bg-linear-to-b from-white/4 to-transparent transition hover:border-cyan-500/25 hover:shadow-[0_0_50px_-25px_rgba(34,211,238,0.4)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 ring-1 ring-white/10">
                      <ShoppingBag className="h-4 w-4 text-violet-300" />
                    </span>
                    <div>
                      <CardTitle className="text-lg">{l.displayName}</CardTitle>
                      <CardDescription>
                        @{l.handle} · {l.category}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={
                      l.trust.verified ? 'success' : 'muted'
                    }
                  >
                    {l.trust.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <p className="text-sm text-slate-300">{l.headline}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="muted" className="rounded-lg font-normal">
                    {l.assets}
                  </Badge>
                  <Badge variant="muted" className="rounded-lg font-normal">
                    {l.usage.termDays} days
                  </Badge>
                  <Badge variant="muted" className="rounded-lg font-normal">
                    {l.usage.territory}
                  </Badge>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {l.highlights.map((s) => (
                    <li key={s} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="pt-2 text-2xl font-bold text-white">
                  ₹{l.pricing.amount.toLocaleString('en-IN')}
                  <span className="text-sm font-normal text-slate-500">
                    /license (sim)
                  </span>
                </p>
              </CardContent>
              <CardFooter>
                <div className="grid w-full gap-2 sm:grid-cols-2">
                  <Button variant="glass" className="w-full" asChild>
                    <Link to={`/app/marketplace/${l.id}`}>View details</Link>
                  </Button>
                  <Button
                    className="w-full"
                    variant={requested === l.id ? 'glass' : 'default'}
                    disabled={requested === l.id}
                    onClick={() => setRequested(l.id)}
                  >
                    {requested === l.id ? 'Saved (demo)' : 'Save'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-white/10 bg-white/2">
        <CardHeader>
          <CardTitle className="text-base">Enterprise identity rails (legacy demo)</CardTitle>
          <CardDescription>Original demo plans retained for pitch completeness</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {marketplaceIdentities.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/4 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.org}</p>
                </div>
                <Badge variant="muted">{item.tier}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">{item.blurb}</p>
              <p className="mt-4 text-lg font-semibold text-white">
                ₹{item.priceInr.toLocaleString('en-IN')}
                <span className="text-sm font-normal text-slate-500">/yr (sim)</span>
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
