export type MarketplaceIdentity = {
  id: string
  name: string
  org: string
  tier: 'Enterprise' | 'Creator' | 'Government'
  /** Annual price in Indian Rupees, consumer-friendly demo tiers */
  priceInr: number
  blurb: string
  signals: string[]
}

/** Sorted by price ascending, starter plans first */
export const marketplaceIdentities: MarketplaceIdentity[] = [
  {
    id: 'cr-nova',
    name: 'Nova Creator Shield',
    org: 'Nova Media Labs',
    tier: 'Creator',
    priceInr: 999,
    blurb: 'Protect public figures from impersonation clips and synthetic audio.',
    signals: ['Short-form scan presets', 'Takedown letter templates (sim)'],
  },
  {
    id: 'ent-pulse',
    name: 'Pulse Workforce',
    org: 'Pulse HR Cloud',
    tier: 'Enterprise',
    priceInr: 1999,
    blurb: 'Employee onboarding with liveness and deepfake-resistant badges.',
    signals: ['HRIS connectors (sim)', 'Bulk enrollment'],
  },
  {
    id: 'ent-aurora',
    name: 'Aurora Trust Line',
    org: 'Aurora Financial',
    tier: 'Enterprise',
    priceInr: 3999,
    blurb: 'Cross-channel voice + face attestation with litigation-ready audit trail.',
    signals: ['SOC2-style controls (sim)', 'API webhooks', '24/7 analyst desk (sim)'],
  },
  {
    id: 'gov-helix',
    name: 'Helix Civic ID',
    org: 'Helix Public Safety',
    tier: 'Government',
    priceInr: 7999,
    blurb: 'High-assurance enrollment with chain-of-custody for evidence packets.',
    signals: ['Air-gapped export UI (sim)', 'Witness signing flow (sim)'],
  },
]

// ---------------------------------------------------------------------------
// Marketplace v2 (consent + licensing) — demo data for pitch/UI
// ---------------------------------------------------------------------------

export type MarketplacePlatform =
  | 'Instagram'
  | 'YouTube'
  | 'TikTok'
  | 'X'
  | 'LinkedIn'
  | 'Website'
  | 'Other'

export type ListingAsset = 'Face' | 'Voice' | 'Face+Voice'

import type { MarketplaceListingApi } from '@/lib/api/types'

export type Listing = {
  id: string
  displayName: string
  handle: string
  category: 'Creator' | 'Actor' | 'Voice Artist' | 'Brand' | 'Athlete'
  headline: string
  assets: ListingAsset
  allowedPlatforms: MarketplacePlatform[]
  usage: {
    termDays: number
    territory: 'Worldwide' | 'India' | 'US' | 'EU'
    allowedUseCases: string[]
    prohibitedUseCases: string[]
  }
  pricing: {
    currency: 'INR'
    amount: number
    billing: 'one_time'
    platformFeePct: number
  }
  trust: {
    verified: boolean
    responseSlaHours: number
    disputeBacked: boolean
  }
  highlights: string[]
}

export const demoListings: Listing[] = [
  {
    id: 'lst-nova-voice',
    displayName: 'Nova Verma',
    handle: 'nova.verma',
    category: 'Voice Artist',
    headline: 'Warm, confident narration voice licensed synthetic usage',
    assets: 'Voice',
    allowedPlatforms: ['Instagram', 'YouTube', 'LinkedIn', 'Website', 'Other'],
    usage: {
      termDays: 30,
      territory: 'Worldwide',
      allowedUseCases: ['Brand narration', 'Product demos', 'Educational content'],
      prohibitedUseCases: ['Political ads', 'Adult content', 'Fraud / impersonation'],
    },
    pricing: { currency: 'INR', amount: 1499, billing: 'one_time', platformFeePct: 12 },
    trust: { verified: true, responseSlaHours: 6, disputeBacked: true },
    highlights: ['Consent certificate', 'Audit log', 'Revocation policy'],
  },
  {
    id: 'lst-arya-face',
    displayName: 'Arya Kapoor',
    handle: 'arya.k',
    category: 'Creator',
    headline: 'UGC face license for ads pre-approved usage categories',
    assets: 'Face',
    allowedPlatforms: ['Instagram', 'TikTok', 'YouTube', 'Website'],
    usage: {
      termDays: 14,
      territory: 'India',
      allowedUseCases: ['UGC ads', 'Explainer videos', 'Brand campaigns'],
      prohibitedUseCases: ['Adult content', 'Fraud / impersonation', 'Medical claims'],
    },
    pricing: { currency: 'INR', amount: 2999, billing: 'one_time', platformFeePct: 12 },
    trust: { verified: true, responseSlaHours: 12, disputeBacked: true },
    highlights: ['Platform safe-words', 'Watermark clause', 'Faster approvals'],
  },
  {
    id: 'lst-zenith-duo',
    displayName: 'Zenith Studio',
    handle: 'zenith.studio',
    category: 'Brand',
    headline: 'Brand avatar license (face + voice) for enterprise comms',
    assets: 'Face+Voice',
    allowedPlatforms: ['LinkedIn', 'Website', 'Other'],
    usage: {
      termDays: 90,
      territory: 'Worldwide',
      allowedUseCases: ['Internal training', 'Product onboarding', 'Corporate comms'],
      prohibitedUseCases: ['Adult content', 'Fraud / impersonation', 'Political messaging'],
    },
    pricing: { currency: 'INR', amount: 9999, billing: 'one_time', platformFeePct: 10 },
    trust: { verified: false, responseSlaHours: 24, disputeBacked: true },
    highlights: ['Enterprise terms', 'Usage logs', 'Dedicated support (sim)'],
  },
]

export function getListingById(id: string): Listing | undefined {
  return demoListings.find((l) => l.id === id)
}

function parseTerritory(t: string): Listing['usage']['territory'] {
  if (t === 'India' || t === 'US' || t === 'EU' || t === 'Worldwide') return t
  return 'Worldwide'
}

function parseCategory(raw: string): Listing['category'] {
  const allowed: Listing['category'][] = ['Creator', 'Actor', 'Voice Artist', 'Brand', 'Athlete']
  return (allowed.find((c) => c === raw) ?? 'Creator') as Listing['category']
}

function parseAssets(raw: string): ListingAsset {
  if (raw === 'Face' || raw === 'Voice' || raw === 'Face+Voice') return raw
  return 'Face+Voice'
}

/** Maps a persisted listing row to the UI `Listing` shape (checkout + PDF). */
export function apiListingToListing(api: MarketplaceListingApi): Listing {
  let allowedPlatforms: MarketplacePlatform[] = []
  try {
    const parsed = JSON.parse(api.allowed_platforms) as unknown
    if (Array.isArray(parsed)) {
      allowedPlatforms = parsed.filter((x): x is MarketplacePlatform => typeof x === 'string') as MarketplacePlatform[]
    }
  } catch {
    allowedPlatforms = api.allowed_platforms
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean) as MarketplacePlatform[]
  }
  if (allowedPlatforms.length === 0) allowedPlatforms = ['Other']

  const allowedUseCases = api.allowed_use_cases
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const prohibitedUseCases = api.prohibited_use_cases
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    id: api.id,
    displayName: api.display_name,
    handle: api.handle,
    category: parseCategory(api.category),
    headline: api.headline,
    assets: parseAssets(api.assets),
    allowedPlatforms,
    usage: {
      termDays: api.term_days,
      territory: parseTerritory(api.territory),
      allowedUseCases: allowedUseCases.length ? allowedUseCases : ['Licensed synthetic usage'],
      prohibitedUseCases: prohibitedUseCases.length
        ? prohibitedUseCases
        : ['Fraud / impersonation', 'Adult content'],
    },
    pricing: {
      currency: 'INR',
      amount: api.amount_inr,
      billing: 'one_time',
      platformFeePct: 12,
    },
    trust: {
      verified: api.verified,
      responseSlaHours: api.verified ? 6 : 24,
      disputeBacked: true,
    },
    highlights: api.verified
      ? ['Consent certificate', 'Audit log', 'Verified licensor']
      : ['Consent certificate', 'Audit log', 'Standard review queue'],
  }
}
