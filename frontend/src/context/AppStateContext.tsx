/* eslint-disable react-refresh/only-export-components -- context hook export */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Analysis, Identity } from '@/lib/api/types'
import {
  getIdentities,
  getAnalyses,
  registerIdentity as apiRegister,
  analyzeMedia as apiAnalyze,
} from '@/lib/api/client'
import {
  clearSelectedIdentityId,
  dismissAlert as dismissAlertStorage,
  isAlertDismissed,
  loadSelectedIdentityId,
  resetAlertDismissed,
  saveSelectedIdentityId,
} from '@/lib/storage'
import { useAuth } from '@clerk/clerk-react'

type AppStateContextValue = {
  identities: Identity[]
  selectedIdentity: Identity | null
  setSelectedIdentityId: (id: string | null) => void
  analyses: Analysis[]
  lastAnalysis: Analysis | null
  loading: boolean
  registering: boolean
  analyzing: boolean
  error: string | null
  registerIdentity: (data: {
    name: string
    email: string
    faceImage: File
    voiceAudio: File
  }) => Promise<Identity>
  runAnalysis: (data: {
    mediaFile: File
    identityId?: string
  }) => Promise<Analysis>
  refreshData: () => Promise<void>
  showSecurityAlert: boolean
  dismissSecurityAlert: () => void
  triggerDemoAlert: () => void
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, getToken } = useAuth()
  const [identities, setIdentities] = useState<Identity[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    loadSelectedIdentityId()
  )
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSecurityAlert, setShowSecurityAlert] = useState(
    () => !isAlertDismissed()
  )

  const refreshData = useCallback(async () => {
    if (!isSignedIn) {
      setIdentities([])
      setAnalyses([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const [ids, ans] = await Promise.all([getIdentities(token ?? undefined), getAnalyses(token ?? undefined)])
      setIdentities(ids)
      setAnalyses(ans)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [getToken, isSignedIn])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const selectedIdentity = useMemo(() => {
    if (selectedId) {
      return identities.find((i) => i.id === selectedId) ?? identities[0] ?? null
    }
    return identities[0] ?? null
  }, [identities, selectedId])

  const lastAnalysis = useMemo(
    () => analyses[0] ?? null,
    [analyses]
  )

  const setSelectedIdentityId = useCallback((id: string | null) => {
    setSelectedId(id)
    if (id) saveSelectedIdentityId(id)
    else clearSelectedIdentityId()
  }, [])

  const registerIdentity = useCallback(
    async (data: {
      name: string
      email: string
      faceImage: File
      voiceAudio: File
    }): Promise<Identity> => {
      setRegistering(true)
      setError(null)
      try {
        const token = await getToken()
        const identity = await apiRegister({ ...data, token: token ?? undefined })
        setIdentities((prev) => [identity, ...prev])
        setSelectedIdentityId(identity.id)
        resetAlertDismissed()
        setShowSecurityAlert(true)
        return identity
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Registration failed'
        setError(msg)
        throw err
      } finally {
        setRegistering(false)
      }
    },
    [getToken, setSelectedIdentityId]
  )

  const runAnalysis = useCallback(
    async (data: {
      mediaFile: File
      identityId?: string
    }): Promise<Analysis> => {
      setAnalyzing(true)
      setError(null)
      try {
        const token = await getToken()
        const analysis = await apiAnalyze({ ...data, token: token ?? undefined })
        setAnalyses((prev) => [analysis, ...prev])
        return analysis
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed'
        setError(msg)
        throw err
      } finally {
        setAnalyzing(false)
      }
    },
    [getToken]
  )

  const dismissSecurityAlert = useCallback(() => {
    dismissAlertStorage()
    setShowSecurityAlert(false)
  }, [])

  const triggerDemoAlert = useCallback(() => {
    resetAlertDismissed()
    setShowSecurityAlert(false)
    window.setTimeout(() => {
      setShowSecurityAlert(true)
    }, 0)
  }, [])

  const value = useMemo(
    () => ({
      identities,
      selectedIdentity,
      setSelectedIdentityId,
      analyses,
      lastAnalysis,
      loading,
      registering,
      analyzing,
      error,
      registerIdentity,
      runAnalysis,
      refreshData,
      showSecurityAlert,
      dismissSecurityAlert,
      triggerDemoAlert,
    }),
    [
      identities,
      selectedIdentity,
      setSelectedIdentityId,
      analyses,
      lastAnalysis,
      loading,
      registering,
      analyzing,
      error,
      registerIdentity,
      runAnalysis,
      refreshData,
      showSecurityAlert,
      dismissSecurityAlert,
      triggerDemoAlert,
    ]
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
