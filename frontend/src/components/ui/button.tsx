/* eslint-disable react-refresh/only-export-components -- shadcn-style variant export */
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[transform,box-shadow,filter,background-color,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/25 hover:-translate-y-0.5 hover:shadow-cyan-500/35 hover:brightness-110',
        glass:
          'border border-white/15 bg-white/5 text-slate-100 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur-md hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_10px_40px_-18px_rgba(0,0,0,0.75)]',
        outline:
          'border border-white/14 bg-transparent text-slate-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white',
        ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
        destructive: 'bg-red-600/90 text-white hover:bg-red-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
