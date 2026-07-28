import { useState } from "react"

import type { CaughtPokemon } from "@/shared/types/pokemon"

/**
 * Owns the catch-reveal modal's state: the species just caught, whether to
 * nudge a guest to sign in, and any error from a failed catch attempt.
 * Exactly one of these three is non-null/true at a time in practice, but the
 * modal (Step 8) decides how to render that, not this hook.
 */
export function useCatchReveal() {
  const [caughtPokemon, setCaughtPokemon] = useState<CaughtPokemon | null>(null)
  const [showLoginNudge, setShowLoginNudge] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dismiss = () => {
    setCaughtPokemon(null)
    setShowLoginNudge(false)
    setError(null)
  }

  return {
    caughtPokemon,
    showLoginNudge,
    error,
    setCaughtPokemon,
    setShowLoginNudge,
    setError,
    dismiss,
  }
}
