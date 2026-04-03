/* eslint-disable react-refresh/only-export-components -- shadcn-style variant export */
import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-cyan-500/30 bg-cyan-500/15 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.15)]',
        success:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
        warning:
          'border-amber-500/30 bg-amber-500/15 text-amber-200',
        danger:
          'border-red-500/30 bg-red-500/15 text-red-200',
        muted: 'border-white/10 bg-white/5 text-slate-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
