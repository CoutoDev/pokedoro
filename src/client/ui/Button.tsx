import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/client/lib/cn"

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border-[3px] border-ink-soft font-heading font-normal uppercase leading-none transition-[transform,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-ink bg-focus text-card shadow-[3px_3px_0_0_var(--color-ink)] hover:brightness-110 focus-visible:ring-focus",
        secondary:
          "bg-card text-ink-soft shadow-[3px_3px_0_0_var(--color-ink-soft)] hover:bg-paper-soft focus-visible:ring-ink-soft/40",
        ghost:
          "bg-card text-ink-soft shadow-[2px_2px_0_0_var(--color-ink-soft)] hover:bg-paper-soft focus-visible:ring-ink-soft/30",
      },
      size: {
        default: "h-11 px-4 text-[11px] tracking-tight",
        sm: "h-10 px-3 text-[10px] tracking-tight",
        circle: "h-20 w-20 rounded-full border-4 border-ink text-base",
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
