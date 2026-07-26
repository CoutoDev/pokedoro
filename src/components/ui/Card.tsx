import type { HTMLAttributes } from "react"

import { cn } from "@/utils/cn"

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-3xl bg-white/70 p-6 shadow-lg shadow-ink/5 backdrop-blur-sm",
      className,
    )}
    {...props}
  />
)
