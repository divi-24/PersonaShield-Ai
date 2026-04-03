import { jsPDF } from 'jspdf'
import type { Listing, MarketplacePlatform } from '@/lib/marketplace'

export type ConsentCertificateInput = {
  listing: Listing
  buyerName: string
  buyerEmail: string
  platform: MarketplacePlatform
  intendedUse: string
  referenceUrl?: string
  amountInr: number
  transactionId: string
}

export function buildConsentCertificatePdf(input: ConsentCertificateInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 18
  let y = margin

  doc.setFillColor(3, 7, 18)
  doc.rect(0, 0, 210, 297, 'F')

  doc.setDrawColor(34, 211, 238)
  doc.setLineWidth(0.35)
  doc.line(margin, 28, 210 - margin, 28)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('PersonaShield — Consent & Licensing Certificate', margin, y + 8)
  y += 18

  doc.setFontSize(10)
  doc.setTextColor(148, 163, 184)
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y)
  y += 10

  doc.setTextColor(203, 213, 225)
  doc.setFontSize(11)
  doc.text('This certificate documents consent-based synthetic usage authorization.', margin, y)
  y += 14

  doc.setFontSize(12)
  doc.setTextColor(34, 211, 238)
  doc.text('License subject', margin, y)
  y += 7
  doc.setFontSize(10)
  doc.setTextColor(203, 213, 225)
  doc.text(`Licensor: ${input.listing.displayName} (@${input.listing.handle})`, margin, y)
  y += 6
  doc.text(`Assets licensed: ${input.listing.assets}`, margin, y)
  y += 10

  doc.setFontSize(12)
  doc.setTextColor(167, 139, 250)
  doc.text('License terms', margin, y)
  y += 7
  doc.setFontSize(10)
  doc.setTextColor(203, 213, 225)
  doc.text(`Term: ${input.listing.usage.termDays} days`, margin, y)
  y += 6
  doc.text(`Territory: ${input.listing.usage.territory}`, margin, y)
  y += 6
  doc.text(`Platform: ${input.platform}`, margin, y)
  y += 6
  doc.text(`Intended use: ${input.intendedUse}`, margin, y, { maxWidth: 210 - margin * 2 })
  y += 12
  if (input.referenceUrl) {
    doc.text(`Reference URL: ${input.referenceUrl}`, margin, y, { maxWidth: 210 - margin * 2 })
    y += 10
  }

  doc.setFontSize(12)
  doc.setTextColor(251, 191, 36)
  doc.text('Buyer', margin, y)
  y += 7
  doc.setFontSize(10)
  doc.setTextColor(203, 213, 225)
  doc.text(`Name: ${input.buyerName}`, margin, y)
  y += 6
  doc.text(`Email: ${input.buyerEmail}`, margin, y)
  y += 12

  doc.setFontSize(12)
  doc.setTextColor(16, 185, 129)
  doc.text('Payment (simulated)', margin, y)
  y += 7
  doc.setFontSize(10)
  doc.setTextColor(203, 213, 225)
  doc.text(`Amount: ₹${input.amountInr.toLocaleString('en-IN')}`, margin, y)
  y += 6
  doc.text(`Transaction ID: ${input.transactionId}`, margin, y)
  y += 14

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(
    'Disclaimer: This is a demo-generated consent certificate. In production, enforceable contracts, KYC/verification, and audit logging are required.',
    margin,
    y,
    { maxWidth: 210 - margin * 2 }
  )

  return doc
}

