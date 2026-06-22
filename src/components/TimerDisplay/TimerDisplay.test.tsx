import { describe, it, expect } from "bun:test"
import { render } from "@testing-library/react"
import TimerDisplay from "./TimerDisplay"

const getDisplayText = (remaining: number) => {
  const { container } = render(<TimerDisplay remaining={remaining} />)
  const display = container.querySelector(".display")
  return display?.textContent
}

describe("TimerDisplay", () => {
  it("renders the display div for any input", () => {
    const { container } = render(<TimerDisplay remaining={42} />)
    expect(container.querySelector(".display")).not.toBeNull()
  })

  it("renders formatted time for common times", () => {
    expect(getDisplayText(1500)).toBe("25:00")  // standard pomodoro
    expect(getDisplayText(300)).toBe("05:00")   // standard break
    expect(getDisplayText(60)).toBe("01:00")    // exactly one minute
    expect(getDisplayText(0)).toBe("00:00")     // zero seconds
    expect(getDisplayText(1)).toBe("00:01")     // one second edge case
    expect(getDisplayText(65)).toBe("01:05")    // seconds overflow
    expect(getDisplayText(3599)).toBe("59:59")  // just before hour mark
    expect(getDisplayText(3600)).toBe("60:00")  // exactly one hour
    expect(getDisplayText(7200)).toBe("120:00") // two hours
  })

  it("pads minutes and seconds with zeros if needed", () => {
    expect(getDisplayText(5)).toBe("00:05")
    expect(getDisplayText(75)).toBe("01:15")
    expect(getDisplayText(600)).toBe("10:00")
  })

  it("handles random in-range times (regression style)", () => {
    expect(getDisplayText(123)).toBe("02:03")
    expect(getDisplayText(987)).toBe("16:27")
  })

  it("never renders negative numbers (regression: lowest possible value is 0)", () => {
    expect(getDisplayText(0)).toBe("00:00")
  })

  it("always renders as a string in mm:ss form for positive seconds", () => {
    const text = getDisplayText(42)
    expect(text).toMatch(/^\d{2,3}:\d{2}$/)
  })
})
