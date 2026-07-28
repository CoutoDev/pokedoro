import type { LabelHTMLAttributes } from "react"

import { cn } from "@/client/lib/cn"

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = ({ className, ...props }: LabelProps) => (
  <label
    className={cn("font-body text-sm font-extrabold text-ink-soft", className)}
    {...props}
  />
)
