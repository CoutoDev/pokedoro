import { describe, it, expect, beforeEach, mock } from "bun:test"
import { render, screen, fireEvent } from "@testing-library/react"
import TimerControls from "./TimerControls"

const getButton = (text: string) => screen.queryByRole("button", { name: text })

const handlers = {
  handleTimerInputChange: mock(() => {}),
  handleStartClick: mock(() => {}),
  handleStartBreakClick: mock(() => {}),
  handleStartLongBreakClick: mock(() => {}),
  handlePauseClick: mock(() => {}),
  handleResetClick: mock(() => {}),
  handleResumeClick: mock(() => {}),
}

describe("TimerControls", () => {
  beforeEach(() => {
    Object.values(handlers).forEach(f => f.mockClear?.())
  })

  it("renders container for any status", () => {
    ["IDLE", "RUNNING", "PAUSED", "UNKNOWN"].forEach(status => {
      const { container } = render(
        <TimerControls status={status} handlers={handlers} />
      )
      expect(container.querySelector(".controls")).toBeDefined()
    })
  })

  describe("when status is IDLE", () => {
    beforeEach(() => {
      render(<TimerControls status="IDLE" handlers={handlers} />)
    })

    it("shows Start, Break and Long Break buttons", () => {
      expect(getButton("Start")).not.toBeNull()
      expect(getButton("Break")).not.toBeNull()
      expect(getButton("Long Break")).not.toBeNull()
      expect(getButton("Pause")).toBeNull()
      expect(getButton("Reset")).toBeNull()
      expect(getButton("Resume")).toBeNull()
    })

    it("calls handleStartClick on Start", () => {
      fireEvent.click(getButton("Start")!)
      expect(handlers.handleStartClick).toHaveBeenCalled()
    })

    it("calls handleStartBreakClick on Break", () => {
      fireEvent.click(getButton("Break")!)
      expect(handlers.handleStartBreakClick).toHaveBeenCalled()
    })

    it("calls handleStartLongBreakClick on Long Break", () => {
      fireEvent.click(getButton("Long Break")!)
      expect(handlers.handleStartLongBreakClick).toHaveBeenCalled()
    })
  })

  describe("when status is RUNNING", () => {
    beforeEach(() => {
      render(<TimerControls status="RUNNING" handlers={handlers} />)
    })

    it("shows Pause and Reset buttons", () => {
      expect(getButton("Pause")).not.toBeNull()
      expect(getButton("Reset")).not.toBeNull()
      expect(getButton("Start")).toBeNull()
      expect(getButton("Break")).toBeNull()
      expect(getButton("Long Break")).toBeNull()
      expect(getButton("Resume")).toBeNull()
    })

    it("calls handlePauseClick on Pause", () => {
      fireEvent.click(getButton("Pause")!)
      expect(handlers.handlePauseClick).toHaveBeenCalled()
    })

    it("calls handleResetClick on Reset", () => {
      fireEvent.click(getButton("Reset")!)
      expect(handlers.handleResetClick).toHaveBeenCalled()
    })
  })

  describe("when status is PAUSED", () => {
    beforeEach(() => {
      render(<TimerControls status="PAUSED" handlers={handlers} />)
    })

    it("shows Resume and Reset buttons", () => {
      expect(getButton("Resume")).not.toBeNull()
      expect(getButton("Reset")).not.toBeNull()
      expect(getButton("Start")).toBeNull()
      expect(getButton("Break")).toBeNull()
      expect(getButton("Long Break")).toBeNull()
      expect(getButton("Pause")).toBeNull()
    })

    it("calls handleResumeClick on Resume", () => {
      fireEvent.click(getButton("Resume")!)
      expect(handlers.handleResumeClick).toHaveBeenCalled()
    })

    it("calls handleResetClick on Reset", () => {
      fireEvent.click(getButton("Reset")!)
      expect(handlers.handleResetClick).toHaveBeenCalled()
    })
  })

  describe("when status is not IDLE/RUNNING/PAUSED", () => {
    it("renders only the container", () => {
      render(<TimerControls status="UNKNOWN" handlers={handlers} />)
      expect(screen.queryByRole("button")).toBeNull()
    })
  })
})
