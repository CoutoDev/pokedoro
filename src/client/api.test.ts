import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"

import { getCycleStats, getPokemonCatches, postCycle, postStoppedCycle } from "@/client/api"

afterEach(() => {
  mock.restore()
})

function mockFetchOnce(response: Response) {
  return (spyOn(globalThis, "fetch") as any).mockImplementation(async () => response)
}

describe("postCycle", () => {
  it("returns the caught Pokemon on success", async () => {
    mockFetchOnce(
      Response.json({ ok: true, catch: { speciesId: 25, caughtAt: "2026-01-01T00:00:00.000Z" } }, { status: 201 })
    )

    const result = await postCycle({
      cycleId: "cycle-1",
      phase: "FOCUS",
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    })

    expect(result).toEqual({ speciesId: 25, caughtAt: "2026-01-01T00:00:00.000Z" })
  })

  it("returns null on a non-OK response", async () => {
    mockFetchOnce(Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }))

    const result = await postCycle({
      cycleId: "cycle-2",
      phase: "FOCUS",
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    })

    expect(result).toBeNull()
  })

  it("returns null when the response has no catch field", async () => {
    mockFetchOnce(Response.json({ ok: true }, { status: 201 }))

    const result = await postCycle({
      cycleId: "cycle-3",
      phase: "FOCUS",
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    })

    expect(result).toBeNull()
  })

  it("returns null and logs on network failure", async () => {
    (spyOn(globalThis, "fetch") as any).mockImplementation(async () => {
      throw new Error("network down")
    })
    const consoleError = spyOn(console, "error").mockImplementation(() => {})

    const result = await postCycle({
      cycleId: "cycle-4",
      phase: "FOCUS",
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    })

    expect(result).toBeNull()
    expect(consoleError).toHaveBeenCalled()
  })
})

describe("getPokemonCatches", () => {
  it("returns the parsed collection summary on success", async () => {
    mockFetchOnce(
      Response.json([{ speciesId: 1, count: 2, lastCaughtAt: "2026-01-01T00:00:00.000Z" }], { status: 200 })
    )

    const result = await getPokemonCatches()

    expect(result).toEqual([{ speciesId: 1, count: 2, lastCaughtAt: "2026-01-01T00:00:00.000Z" }])
  })

  it("returns null when unauthenticated", async () => {
    mockFetchOnce(Response.json({ error: "Unauthorized" }, { status: 401 }))

    const result = await getPokemonCatches()

    expect(result).toBeNull()
  })

  it("returns null and logs on network failure", async () => {
    (spyOn(globalThis, "fetch") as any).mockImplementation(async () => {
      throw new Error("network down")
    })
    const consoleError = spyOn(console, "error").mockImplementation(() => {})

    const result = await getPokemonCatches()

    expect(result).toBeNull()
    expect(consoleError).toHaveBeenCalled()
  })
})

describe("postStoppedCycle", () => {
  const payload = {
    cycleId: "c1", phase: "FOCUS" as const, focusDuration: 1500, shortBreakDuration: 300, longBreakDuration: 900, elapsedSeconds: 60,
  }

  it("returns true on success", async () => {
    mockFetchOnce(Response.json({ ok: true }, { status: 201 }))
    expect(await postStoppedCycle(payload)).toBe(true)
  })

  it("returns false on a non-OK response", async () => {
    mockFetchOnce(Response.json({}, { status: 500 }))
    expect(await postStoppedCycle(payload)).toBe(false)
  })

  it("returns false when the request throws", async () => {
    spyOn(console, "error").mockImplementation(() => {})
    ;(spyOn(globalThis, "fetch") as any).mockImplementation(async () => { throw new Error("offline") })
    expect(await postStoppedCycle(payload)).toBe(false)
  })
})

describe("getCycleStats", () => {
  const body = {
    stats: {
      completedSets: 0, focusTowardNextSet: 0,
      byPhase: { FOCUS: { completed: 0, stopped: 0 }, SHORT_BREAK: { completed: 0, stopped: 0 }, LONG_BREAK: { completed: 0, stopped: 0 } },
      focusCompletionRate: null, focusSecondsCompleted: 0, focusSecondsStopped: 0, totalCatches: 0, uniqueSpecies: 0,
    },
    sets: [],
  }

  it("returns the parsed stats", async () => {
    mockFetchOnce(Response.json(body))
    expect(await getCycleStats()).toEqual(body)
  })

  it("returns null on a non-OK response", async () => {
    mockFetchOnce(Response.json({}, { status: 401 }))
    expect(await getCycleStats()).toBeNull()
  })

  it("returns null when the payload fails validation", async () => {
    spyOn(console, "error").mockImplementation(() => {})
    mockFetchOnce(Response.json({ nope: true }))
    expect(await getCycleStats()).toBeNull()
  })
})
