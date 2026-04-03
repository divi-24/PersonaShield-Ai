import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function AuthSignUpPage() {
  return (
    <div className="relative min-h-screen ps-landing-hero text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ps-aurora" />
        <div className="ps-noise" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Button variant="glass" className="rounded-xl border-white/10" asChild>
            <Link to="/">Back</Link>
          </Button>
          <Button variant="ghost" className="text-slate-400" asChild>
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/3 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-6">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              afterSignUpUrl="/app"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

