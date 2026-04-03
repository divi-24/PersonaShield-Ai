import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  className?: string
  action?: ReactNode
  /** Optional chips or badges under the description */
  badges?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  action,
  badges,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
        {badges ? (
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
