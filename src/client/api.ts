import { caughtPokemonSchema, pokemonCatchesSummarySchema } from "@/shared/schemas/pokemonCatch"
import type { PokemonCatchesSummary } from "@/shared/schemas/pokemonCatch"
import type { CyclePayload } from "@/shared/schemas/pomodoroCycle"
import type { SerializedUser } from "@/shared/reviveUser"
import type { CaughtPokemon } from "@/shared/types/pokemon"
import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)
  return typeof body?.error === "string" ? body.error : fallback
}

export async function getMe(): Promise<{ ok: true; user: SerializedUser } | { ok: false }> {
  const res = await fetch("/api/auth/me")
  if (!res.ok) return { ok: false }

  const { user } = await res.json()
  return { ok: true, user }
}

export async function requestOtp(email: string): Promise<ApiResult<void>> {
  const res = await fetch("/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) return { ok: false, error: await readError(res, "Failed to send code") }
  return { ok: true, data: undefined }
}

export async function verifyOtp(email: string, code: string): Promise<ApiResult<SerializedUser>> {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  })

  if (!res.ok) return { ok: false, error: await readError(res, "Invalid code") }

  const { user } = await res.json()
  return { ok: true, data: user }
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
}

export async function getTimerState(): Promise<unknown> {
  const res = await fetch("/api/timer-state")
  if (!res.ok) return null

  const { state } = await res.json()
  return state
}

export async function putTimerState(timer: PomodoroCycle): Promise<void> {
  await fetch("/api/timer-state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(timer),
  })
}

export async function postCycle(payload: CyclePayload): Promise<CaughtPokemon | null> {
  try {
    const res = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null

    const body = await res.json()
    if (!body?.catch) return null

    return caughtPokemonSchema.parse(body.catch)
  } catch (error) {
    console.error("Failed to record cycle:", error)
    return null
  }
}

export async function getPokemonCatches(): Promise<PokemonCatchesSummary | null> {
  try {
    const res = await fetch("/api/pokemon-catches", { credentials: "include" })
    if (!res.ok) return null

    return pokemonCatchesSummarySchema.parse(await res.json())
  } catch (error) {
    console.error("Failed to fetch Pokémon catches:", error)
    return null
  }
}
