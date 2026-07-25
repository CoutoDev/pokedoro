const STORAGE_KEY = "pokedoro-auth-flag"

export const hasAuthFlag = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export const setAuthFlag = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, "1")
  } catch {
    // Ignore write failures (e.g. Safari private mode, storage quota exceeded).
  }
}

export const clearAuthFlag = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore write failures.
  }
}
