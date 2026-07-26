import type { LabelHTMLAttributes } from "react"

import { cn } from "@/utils/cn"

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = ({ className, ...props }: LabelProps) => (
  <label
    className={cn("font-heading text-xs font-bold text-ink-soft", className)}
    {...props}
  />
)
