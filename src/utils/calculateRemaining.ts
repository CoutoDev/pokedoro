export const calculateRemaining = (
  sessionTimeout: Date | null,
  focusDuration: number,
) => {
  if (!sessionTimeout) return focusDuration

  const now = new Date()
  const diff = sessionTimeout.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / 1000))
}
