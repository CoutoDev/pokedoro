export type RingMetrics = {
  circumference: number
  offset: number
}

/** Circle progress-ring geometry for an SVG stroke-dasharray/dashoffset countdown ring. */
export const getRingMetrics = (remaining: number, total: number, radius: number): RingMetrics => {
  const circumference = 2 * Math.PI * radius
  const rawProgress = total > 0 ? (total - remaining) / total : 0
  const progress = Math.min(1, Math.max(0, rawProgress))

  return {
    circumference,
    offset: circumference * (1 - progress),
  }
}
