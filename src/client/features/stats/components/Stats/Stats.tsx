import { useEffect, useState } from "react"

import { getCycleStats } from "@/client/api"
import { useAuthContext } from "@/client/features/auth/AuthContext"
import type { CycleStatsResponse } from "@/shared/schemas/cycleStats"

import StatsHistory from "./StatsHistory"
import StatsSummary from "./StatsSummary"

const Stats = () => {
  const { auth } = useAuthContext()
  const [data, setData] = useState<CycleStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (auth.status !== "authenticated") {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getCycleStats().then((result) => {
      if (cancelled) return

      if (result === null) {
        setError("Couldn't load your stats — try again")
      } else {
        setData(result)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [auth.status])

  if (auth.status !== "authenticated") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border-[3px] border-dashed border-muted bg-card p-8 text-center">
        <p className="font-body text-lg font-extrabold text-ink-soft">Sign in to see your stats</p>
        <p className="text-sm font-semibold text-muted">
          Cycles are tracked for signed-in trainers — sign in above to start your history.
        </p>
      </div>
    )
  }

  if (loading) {
    return <p className="p-6 text-center text-sm font-semibold text-muted">Loading your stats…</p>
  }

  if (error || !data) {
    return <p className="p-6 text-center text-sm font-semibold text-focus">{error}</p>
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <StatsSummary stats={data.stats} />
      <StatsHistory sets={data.sets} />
    </div>
  )
}

export default Stats
