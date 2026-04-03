import type {
  Identity,
  IdentityDetail,
  Analysis,
  ReportResponse,
  LegalAssistantResponse,
  MarketplaceTransaction,
  NoticeLog,
  MarketplaceListingApi,
  Dispute,
  MisuseReport,
} from './types'

/** Empty string = same-origin (production bundle behind API). */
export const API_BASE: string =
  typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:8000'

function resolveUrl(path: string): string {
  if (API_BASE === '') return path
  return `${API_BASE}${path}`
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  return res.json() as Promise<T>
}

function authHeaders(token?: string): HeadersInit {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function registerIdentity(data: {
  name: string
  email: string
  faceImage: File
  voiceAudio: File
  token?: string
}): Promise<Identity> {
  const form = new FormData()
  form.append('name', data.name)
  form.append('email', data.email)
  form.append('face_image', data.faceImage)
  form.append('voice_audio', data.voiceAudio)

  const res = await fetch(resolveUrl('/api/register'), {
    method: 'POST',
    headers: authHeaders(data.token),
    body: form,
  })
  return handleResponse<Identity>(res)
}

export async function getIdentities(token?: string): Promise<Identity[]> {
  const res = await fetch(resolveUrl('/api/identities'), { headers: authHeaders(token) })
  return handleResponse<Identity[]>(res)
}

export async function analyzeMedia(data: {
  mediaFile: File
  identityId?: string
  token?: string
}): Promise<Analysis> {
  const form = new FormData()
  form.append('media_file', data.mediaFile)
  if (data.identityId) {
    form.append('identity_id', data.identityId)
  }

  const res = await fetch(resolveUrl('/api/analyze'), {
    method: 'POST',
    headers: authHeaders(data.token),
    body: form,
  })
  return handleResponse<Analysis>(res)
}

export async function getAnalyses(token?: string): Promise<Analysis[]> {
  const res = await fetch(resolveUrl('/api/analyses'), { headers: authHeaders(token) })
  return handleResponse<Analysis[]>(res)
}

export async function getAnalysis(analysisId: string, token?: string): Promise<Analysis> {
  const res = await fetch(resolveUrl(`/api/analyses/${analysisId}`), {
    headers: authHeaders(token),
  })
  return handleResponse<Analysis>(res)
}

export async function getIdentityDetail(identityId: string, token?: string): Promise<IdentityDetail> {
  const res = await fetch(resolveUrl(`/api/identities/${identityId}`), {
    headers: authHeaders(token),
  })
  return handleResponse<IdentityDetail>(res)
}

export async function getReport(analysisId: string, token?: string): Promise<ReportResponse> {
  const res = await fetch(resolveUrl(`/api/reports/${analysisId}`), { headers: authHeaders(token) })
  return handleResponse<ReportResponse>(res)
}

export async function getReports(token?: string): Promise<ReportResponse[]> {
  const res = await fetch(resolveUrl('/api/reports'), { headers: authHeaders(token) })
  return handleResponse<ReportResponse[]>(res)
}

export async function chatLegalAssistant(data: {
  messages: { role: 'user' | 'assistant'; content: string }[]
  analysisId?: string
  identityId?: string
  documentType?: string
  token?: string
}): Promise<LegalAssistantResponse> {
  const res = await fetch(resolveUrl('/api/legal-assistant/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(data.token) },
    body: JSON.stringify({
      messages: data.messages,
      analysis_id: data.analysisId,
      identity_id: data.identityId,
      document_type: data.documentType,
    }),
  })
  return handleResponse<LegalAssistantResponse>(res)
}

export async function createMarketplaceTransaction(data: {
  listingId: string
  buyerName: string
  buyerEmail: string
  platform: string
  intendedUse: string
  referenceUrl?: string
  amountInr: number
  token?: string
}): Promise<MarketplaceTransaction> {
  const res = await fetch(resolveUrl('/api/marketplace/transactions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(data.token) },
    body: JSON.stringify({
      listing_id: data.listingId,
      buyer_name: data.buyerName,
      buyer_email: data.buyerEmail,
      platform: data.platform,
      intended_use: data.intendedUse,
      reference_url: data.referenceUrl,
      amount_inr: data.amountInr,
    }),
  })
  return handleResponse<MarketplaceTransaction>(res)
}

export async function getMarketplaceTransactions(token?: string): Promise<MarketplaceTransaction[]> {
  const res = await fetch(resolveUrl('/api/marketplace/transactions'), {
    headers: authHeaders(token),
  })
  return handleResponse<MarketplaceTransaction[]>(res)
}

export async function createNoticeLog(data: {
  targetType: string
  targetValue: string
  platform?: string
  contentUrl?: string
  evidenceSummary?: string
  documentType: string
  message: string
  status?: string
  token?: string
}): Promise<NoticeLog> {
  const res = await fetch(resolveUrl('/api/notices'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(data.token) },
    body: JSON.stringify({
      target_type: data.targetType,
      target_value: data.targetValue,
      platform: data.platform,
      content_url: data.contentUrl,
      evidence_summary: data.evidenceSummary,
      document_type: data.documentType,
      message: data.message,
      status: data.status ?? 'sent',
    }),
  })
  return handleResponse<NoticeLog>(res)
}

export async function getNoticeLogs(token?: string): Promise<NoticeLog[]> {
  const res = await fetch(resolveUrl('/api/notices'), { headers: authHeaders(token) })
  return handleResponse<NoticeLog[]>(res)
}

export async function getMarketplaceListings(): Promise<MarketplaceListingApi[]> {
  const res = await fetch(resolveUrl('/api/marketplace/listings'))
  return handleResponse<MarketplaceListingApi[]>(res)
}

export async function getMarketplaceListing(listingId: string): Promise<MarketplaceListingApi> {
  const res = await fetch(resolveUrl(`/api/marketplace/listings/${listingId}`))
  return handleResponse<MarketplaceListingApi>(res)
}

export async function createDispute(
  data: {
    targetUser: string
    reason: string
    evidenceSummary?: string
    contentUrl?: string
    resolutionSought?: string
    token?: string
  }
): Promise<Dispute> {
  const res = await fetch(resolveUrl('/api/disputes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(data.token) },
    body: JSON.stringify({
      target_user: data.targetUser,
      reason: data.reason,
      evidence_summary: data.evidenceSummary,
      content_url: data.contentUrl,
      resolution_sought: data.resolutionSought ?? 'content_removal',
    }),
  })
  return handleResponse<Dispute>(res)
}

export async function getDisputes(token?: string): Promise<Dispute[]> {
  const res = await fetch(resolveUrl('/api/disputes'), { headers: authHeaders(token) })
  return handleResponse<Dispute[]>(res)
}

export async function createMisuseReport(data: {
  platform: string
  contentUrl?: string
  evidenceSummary?: string
  reportType?: string
  description: string
  token?: string
}): Promise<MisuseReport> {
  const res = await fetch(resolveUrl('/api/misuse-reports'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(data.token) },
    body: JSON.stringify({
      platform: data.platform,
      content_url: data.contentUrl,
      evidence_summary: data.evidenceSummary,
      report_type: data.reportType ?? 'deepfake_misuse',
      description: data.description,
    }),
  })
  return handleResponse<MisuseReport>(res)
}

export async function getMisuseReports(token?: string): Promise<MisuseReport[]> {
  const res = await fetch(resolveUrl('/api/misuse-reports'), { headers: authHeaders(token) })
  return handleResponse<MisuseReport[]>(res)
}

export function resolveReportUrl(reportUrl: string | null): string | null {
  if (!reportUrl) return null
  if (reportUrl.startsWith('/')) {
    if (API_BASE === '') return reportUrl
    return `${API_BASE}${reportUrl}`
  }
  return reportUrl
}
