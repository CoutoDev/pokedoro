import { forwardRef, type InputHTMLAttributes } from "react"

import { cn } from "@/client/lib/cn"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border-2 border-white bg-white/80 px-4 font-body text-base text-ink-soft shadow-sm shadow-ink/5 placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = "Input"
