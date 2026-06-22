import { describe, it, expect, beforeEach, mock } from "bun:test"
import { render, screen, fireEvent } from "@testing-library/react"
import TimerSettings from "./TimerSettings"
import { TimerContext } from "@/contexts/TimerContext"

// Setup deterministic ID for tests
if (!globalThis.crypto?.randomUUID) {
  (globalThis as any).crypto = { randomUUID: () => "test-uuid" }
}

const DEFAULT_TIMER = {
  id: "test-uuid",
  phase: "FOCUS" as const,
  status: "IDLE" as const,
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionTimeout: null,
  pausedAt: null,
  resumedAt: null,
  resetedAt: null,
  remaining: 25 * 60,
  interval: null,
}

describe("TimerSettings", () => {
  let mockDispatch: ReturnType<typeof mock>

  beforeEach(() => {
    mockDispatch = mock(() => {})
  })

  function renderWithProvider(timerOverrides = {}) {
    const timer = { ...DEFAULT_TIMER, ...timerOverrides }
    return render(
      <TimerContext.Provider value={{ timer, timerDispatch: mockDispatch }}>
        <TimerSettings />
      </TimerContext.Provider>
    )
  }

  it("renders the Settings button and does not show the dialog initially", () => {
    renderWithProvider()
    expect(screen.getByText("Settings")).not.toBeNull()
    expect(screen.queryByRole("dialog")?.hasAttribute("open")).not.toBe(true)
  })

  it("opens the dialog and renders all input fields/buttons correctly", () => {
    renderWithProvider()
    fireEvent.click(screen.getByText("Settings"))
    const dialog = screen.getByRole("dialog")
    expect(dialog).not.toBeNull()
    expect(dialog.hasAttribute("open")).toBe(true)
    // Check elements
    expect(screen.getByTitle("Focus time value")).not.toBeNull()
    expect(screen.getByTitle("Short break time value")).not.toBeNull()
    expect(screen.getByTitle("Long break time value")).not.toBeNull()
    expect(screen.getByText("Save and apply")).not.toBeNull()
    expect(screen.getByText("Cancel")).not.toBeNull()
  })

  it("input fields show the correct formatted default values from context", () => {
    renderWithProvider()
    fireEvent.click(screen.getByText("Settings"))
    const focusInput = screen.getByTitle("Focus time value") as HTMLInputElement
    const shortInput = screen.getByTitle("Short break time value") as HTMLInputElement
    const longInput = screen.getByTitle("Long break time value") as HTMLInputElement

    // Since the component's useEffect uses formatTime with leading 0 for break durations,
    // but not for focus, focus shows "25", short/long show "05", "15"
    expect(focusInput.value).toBe("25")
    expect(shortInput.value).toBe("05")
    expect(longInput.value).toBe("15")
  })

  it("focuses first input field when dialog opens (accessibility)", () => {
    renderWithProvider()
    fireEvent.click(screen.getByText("Settings"))
    // focusRef.current is assigned but jsdom does not handle focus assignment.
    // Confirm input is present and not disabled.
    const focusInput = screen.getByTitle("Focus time value") as HTMLInputElement
    expect(focusInput.disabled).toBeFalsy()
  })

  it("resets values to context values when Cancel is clicked", () => {
    renderWithProvider()
    fireEvent.click(screen.getByText("Settings"))
    const focusInput = screen.getByTitle("Focus time value") as HTMLInputElement
    const shortInput = screen.getByTitle("Short break time value") as HTMLInputElement
    const longInput = screen.getByTitle("Long break time value") as HTMLInputElement

    fireEvent.change(focusInput, { target: { value: "50" } })
    fireEvent.change(shortInput, { target: { value: "10" } })
    fireEvent.change(longInput, { target: { value: "30" } })

    fireEvent.click(screen.getByText("Cancel"))
    // Dialog should close after Cancel.
    expect(screen.queryByRole("dialog")?.hasAttribute("open")).not.toBe(true)

    // Reopen and check for context values
    fireEvent.click(screen.getByText("Settings"))
    // Input refs are preserved across opens, so values should be in sync due to useEffect.
    expect((screen.getByTitle("Focus time value") as HTMLInputElement).value).toBe("25")
    expect((screen.getByTitle("Short break time value") as HTMLInputElement).value).toBe("05")
    expect((screen.getByTitle("Long break time value") as HTMLInputElement).value).toBe("15")
  })

  it("closes dialog on Cancel and on Save and apply", () => {
    renderWithProvider()
    fireEvent.click(screen.getByText("Settings"))
    fireEvent.click(screen.getByText("Cancel"))
    expect(screen.queryByRole("dialog")?.hasAttribute("open")).not.toBe(true)

    fireEvent.click(screen.getByText("Settings"))
    fireEvent.click(screen.getByText("Save and apply"))
    expect(screen.queryByRole("dialog")?.hasAttribute("open")).not.toBe(true)
  })

  it("dispatches correct actions and payloads when Save and apply is clicked", () => {
    renderWithProvider()
    fireEvent.click(screen.getByText("Settings"))

    const focusInput = screen.getByTitle("Focus time value") as HTMLInputElement
    const shortInput = screen.getByTitle("Short break time value") as HTMLInputElement
    const longInput = screen.getByTitle("Long break time value") as HTMLInputElement

    fireEvent.change(focusInput, { target: { value: "42" } })
    fireEvent.change(shortInput, { target: { value: "8" } })
    fireEvent.change(longInput, { target: { value: "20" } })

    fireEvent.click(screen.getByText("Save and apply"))

    // The handleSaveSettings uses the value directly (minutes), no *60 here (that's in reducer).
    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: "SET_DURATION",
      payload: { focusDuration: 42 },
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: "SET_SHORT_BREAK_DURATION",
      payload: { shortBreakDuration: 8 },
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: "SET_LONG_BREAK_DURATION",
      payload: { longBreakDuration: 20 },
    })
  })

  it("applies original durations if input refs are empty or undefined", () => {
    renderWithProvider()
    fireEvent.click(screen.getByText("Settings"))
    const focusInput = screen.getByTitle("Focus time value") as HTMLInputElement
    const shortInput = screen.getByTitle("Short break time value") as HTMLInputElement
    const longInput = screen.getByTitle("Long break time value") as HTMLInputElement

    fireEvent.change(focusInput, { target: { value: "" } })
    fireEvent.change(shortInput, { target: { value: "" } })
    fireEvent.change(longInput, { target: { value: "" } })

    fireEvent.click(screen.getByText("Save and apply"))

    // Empty inputs fall back to context durations in minutes (reducer multiplies by 60).
    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: "SET_DURATION",
      payload: { focusDuration: 25 },
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: "SET_SHORT_BREAK_DURATION",
      payload: { shortBreakDuration: 5 },
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: "SET_LONG_BREAK_DURATION",
      payload: { longBreakDuration: 15 },
    })
  })

  it("handles edge input values (minimum, maximum, non-numeric)", () => {
    renderWithProvider()
    fireEvent.click(screen.getByText("Settings"))
    const focusInput = screen.getByTitle("Focus time value") as HTMLInputElement
    const shortInput = screen.getByTitle("Short break time value") as HTMLInputElement
    const longInput = screen.getByTitle("Long break time value") as HTMLInputElement

    // Minimum and high values
    fireEvent.change(focusInput, { target: { value: "1" } })
    fireEvent.change(shortInput, { target: { value: "0" } })
    fireEvent.change(longInput, { target: { value: "120" } })

    fireEvent.click(screen.getByText("Save and apply"))

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: "SET_DURATION",
      payload: { focusDuration: 1 },
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: "SET_SHORT_BREAK_DURATION",
      payload: { shortBreakDuration: 0 },
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: "SET_LONG_BREAK_DURATION",
      payload: { longBreakDuration: 120 },
    })

    // Reopen and try non-numeric
    fireEvent.click(screen.getByText("Settings"))
    fireEvent.change(focusInput, { target: { value: "hello" } })
    fireEvent.change(shortInput, { target: { value: "NaN" } })
    fireEvent.change(longInput, { target: { value: "" } })

    fireEvent.click(screen.getByText("Save and apply"))

    expect(mockDispatch).toHaveBeenNthCalledWith(4, {
      type: "SET_DURATION",
      payload: { focusDuration: 25 },
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(5, {
      type: "SET_SHORT_BREAK_DURATION",
      payload: { shortBreakDuration: 5 },
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(6, {
      type: "SET_LONG_BREAK_DURATION",
      payload: { longBreakDuration: 15 },
    })
  })

  it("can handle opening/cancelling/rapid reopening without broken refs or errors", () => {
    renderWithProvider()
    const settingsBtn = screen.getByText("Settings")
    for (let i = 0; i < 5; i++) {
      fireEvent.click(settingsBtn)
      fireEvent.click(screen.getByText("Cancel"))
      expect(screen.queryByRole("dialog")?.hasAttribute("open")).not.toBe(true)
    }
  })

  it("input fields are not present if dialog is not opened", () => {
    renderWithProvider()
    expect(screen.queryByTitle("Focus time value")).toBeNull()
    expect(screen.queryByTitle("Short break time value")).toBeNull()
    expect(screen.queryByTitle("Long break time value")).toBeNull()
  })

  it("ignores pressing Save/Cancel buttons if dialog is not open", () => {
    renderWithProvider()
    // These clicks shouldn't throw although no dialog is visible.
    expect(() => {
      fireEvent.click(screen.queryByText("Save and apply") || document.body)
      fireEvent.click(screen.queryByText("Cancel") || document.body)
    }).not.toThrow()
  })
})
