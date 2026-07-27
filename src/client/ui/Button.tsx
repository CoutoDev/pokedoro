import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/client/lib/cn"

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-heading font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-focus-soft to-focus text-white shadow-lg shadow-focus/30 hover:brightness-105 focus-visible:ring-focus",
        secondary:
          "bg-white/80 text-ink-soft shadow-sm shadow-ink/5 hover:bg-white focus-visible:ring-ink-soft/40",
        ghost:
          "bg-white/60 text-ink-soft hover:bg-white focus-visible:ring-ink-soft/30",
      },
      size: {
        default: "h-12 px-5 text-base",
        sm: "h-10 px-4 text-sm",
        circle: "h-20 w-20 rounded-full text-base",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)

Button.displayName = "Button"
