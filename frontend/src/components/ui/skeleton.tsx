import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/[0.06] ring-1 ring-white/[0.04]',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
