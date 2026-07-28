import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"

import { getPokemonCatches, postCycle } from "@/client/api"

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
