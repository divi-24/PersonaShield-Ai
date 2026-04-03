export type Identity = {
  id: string
  name: string
  email: string
  created_at: string
  has_face_embedding?: boolean
  has_voice_embedding?: boolean
  analysis_count?: number
}

export type IdentityDetail = {
  id: string
  name: string
  email: string
  created_at: string
  has_face_embedding: boolean
  has_voice_embedding: boolean
  analysis_count: number
  last_scan_at: string | null
  recent_scans: IdentityScanSummary[]
}

export type IdentityScanSummary = {
  id: string
  created_at: string
  deepfake_score: number
  is_deepfake: boolean
}

export type Analysis = {
  id: string
  identity_id?: string | null
  deepfake_score: number
  face_match_score: number | null
  voice_match_score: number | null
  authenticity_score: number
  explanation: string
  report_url: string | null
  is_deepfake: boolean
  created_at?: string | null
}

export type ReportResponse = {
  report_url: string
  generated_at: string
}

export type LegalAssistantResponse = {
  reply: string
}

export type MarketplaceTransaction = {
  id: string
  listing_id: string
  buyer_name: string
  buyer_email: string
  platform: string
  intended_use: string
  reference_url?: string | null
  amount_inr: number
  status: string
  certificate_url?: string | null
  created_at: string
}

export type NoticeLog = {
  id: string
  target_type: string
  target_value: string
  platform?: string | null
  content_url?: string | null
  evidence_summary?: string | null
  document_type: string
  message: string
  status: string
  created_at: string
}

export type MarketplaceListingApi = {
  id: string
  user_id: string
  display_name: string
  handle: string
  category: string
  headline: string
  assets: string
  allowed_platforms: string
  term_days: number
  territory: string
  allowed_use_cases: string
  prohibited_use_cases: string
  amount_inr: number
  verified: boolean
  created_at: string
}

export type Dispute = {
  id: string
  user_id: string
  target_user: string
  reason: string
  evidence_summary?: string | null
  content_url?: string | null
  resolution_sought: string
  status: string
  created_at: string
  updated_at: string
}

export type MisuseReport = {
  id: string
  user_id: string
  platform: string
  content_url?: string | null
  evidence_summary?: string | null
  report_type: string
  description: string
  status: string
  created_at: string
}
