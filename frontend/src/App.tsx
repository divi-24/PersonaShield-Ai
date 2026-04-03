import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequireIdentityVault } from '@/components/auth/RequireIdentityVault'
import { AppShell } from '@/components/layout/AppShell'
import { AppStateProvider } from '@/context/AppStateContext'
import { AuthSignInPage } from '@/pages/AuthSignIn'
import { AuthSignUpPage } from '@/pages/AuthSignUp'
import { DashboardPage } from '@/pages/Dashboard'
import { DeepfakeDetectionPage } from '@/pages/DeepfakeDetection'
import { LandingPage } from '@/pages/Landing'
import { LegalAssistantPage } from '@/pages/LegalAssistant'
import { LegalReportPage } from '@/pages/LegalReport'
import { MarketplacePage } from '@/pages/Marketplace'
import { MarketplaceCheckoutPage } from '@/pages/MarketplaceCheckout'
import { MarketplaceListingPage } from '@/pages/MarketplaceListing'
import { DisputesPage } from '@/pages/Disputes'
import { MisuseReportPage } from '@/pages/MisuseReport'
import { EnrollmentsPage } from '@/pages/Enrollments'
import { RegisterPage } from '@/pages/Register'
import { ResultsPage } from '@/pages/Results'

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<AuthSignInPage />} />
          <Route path="/sign-up" element={<AuthSignUpPage />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route
              index
              element={
                <RequireIdentityVault>
                  <DashboardPage />
                </RequireIdentityVault>
              }
            />
            <Route path="register" element={<RegisterPage />} />
            <Route
              path="enrollments"
              element={
                <RequireIdentityVault>
                  <EnrollmentsPage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="deepfake"
              element={
                <RequireIdentityVault>
                  <DeepfakeDetectionPage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="results/:analysisId?"
              element={
                <RequireIdentityVault>
                  <ResultsPage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="legal"
              element={
                <RequireIdentityVault>
                  <LegalReportPage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="marketplace"
              element={
                <RequireIdentityVault>
                  <MarketplacePage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="marketplace/:listingId"
              element={
                <RequireIdentityVault>
                  <MarketplaceListingPage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="marketplace/:listingId/checkout"
              element={
                <RequireIdentityVault>
                  <MarketplaceCheckoutPage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="assistant"
              element={
                <RequireIdentityVault>
                  <LegalAssistantPage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="misuse"
              element={
                <RequireIdentityVault>
                  <MisuseReportPage />
                </RequireIdentityVault>
              }
            />
            <Route
              path="disputes"
              element={
                <RequireIdentityVault>
                  <DisputesPage />
                </RequireIdentityVault>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  )
}
