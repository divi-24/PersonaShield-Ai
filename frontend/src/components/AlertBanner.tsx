import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/context/AppStateContext'

export function AlertBanner() {
  const { showSecurityAlert, dismissSecurityAlert } = useAppState()

  return (
    <AnimatePresence>
      {showSecurityAlert && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent"
        >
          <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <p className="flex-1 text-sm text-amber-100/95">
              <span className="font-semibold">Identity alert:</span> Your
              registered profile signals were correlated with suspicious media
              on the open web. Review recent scans and generate a legal proof
              bundle if needed.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-amber-200 hover:bg-amber-500/10"
              onClick={dismissSecurityAlert}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
