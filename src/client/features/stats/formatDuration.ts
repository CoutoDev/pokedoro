/** Compact human duration for totals: 45s, 12m, 2h 05m. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`

  return `${Math.floor(minutes / 60)}h ${(minutes % 60).toString().padStart(2, '0')}m`
}
