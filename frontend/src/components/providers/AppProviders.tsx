import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProviders({ children }: { children: ReactNode }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

  if (!key) {
    return (
      <TooltipProvider delayDuration={200} skipDelayDuration={100}>
        <div className="mx-auto max-w-2xl px-6 py-16 text-slate-100">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <p className="text-sm font-semibold text-amber-200">
              Missing Clerk publishable key
            </p>
            <p className="mt-2 text-sm text-amber-200/80">
              Set <span className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</span>{' '}
              in <span className="font-mono">frontend/.env</span> (see{' '}
              <span className="font-mono">frontend/.env.example</span>).
            </p>
          </div>
        </div>
      </TooltipProvider>
    )
  }
  return (
    <ClerkProvider publishableKey={key}>
      <TooltipProvider delayDuration={200} skipDelayDuration={100}>
        {children}
      </TooltipProvider>
    </ClerkProvider>
  )
}
