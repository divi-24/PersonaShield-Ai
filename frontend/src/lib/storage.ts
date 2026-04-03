const KEYS = {
  selectedIdentityId: 'personashield_selected_identity',
  alertDismissed: 'personashield_alert_dismissed',
} as const

export function loadSelectedIdentityId(): string | null {
  return localStorage.getItem(KEYS.selectedIdentityId)
}

export function saveSelectedIdentityId(id: string): void {
  localStorage.setItem(KEYS.selectedIdentityId, id)
}

export function clearSelectedIdentityId(): void {
  localStorage.removeItem(KEYS.selectedIdentityId)
}

export function isAlertDismissed(): boolean {
  return localStorage.getItem(KEYS.alertDismissed) === '1'
}

export function dismissAlert(): void {
  localStorage.setItem(KEYS.alertDismissed, '1')
}

export function resetAlertDismissed(): void {
  localStorage.removeItem(KEYS.alertDismissed)
}
