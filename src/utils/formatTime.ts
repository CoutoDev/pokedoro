export const formatTime = (seconds: number, showSeconds: boolean = true): string =>
  {
    const minutesText = `${Math.floor(seconds / 60).toString().padStart(2, '0')}`
    const secondsText = `:${(seconds % 60).toString().padStart(2, '0')}` 
    
    return showSeconds ? `${minutesText}${secondsText}` : minutesText
  }
