export const formatTime = (seconds: number, showSeconds: boolean = true): string =>
  {
    // Countdown timers should never display negative time; clamp to zero.
    const clampedSeconds = Math.max(seconds, 0)
    const minutesText = `${Math.floor(clampedSeconds / 60).toString().padStart(2, '0')}`
    const secondsText = `:${(clampedSeconds % 60).toString().padStart(2, '0')}`

    return showSeconds ? `${minutesText}${secondsText}` : minutesText
  }
