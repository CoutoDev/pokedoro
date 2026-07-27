import type { ChangeEvent } from "react"

import { afterEach, describe, expect, it, mock } from "bun:test"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

import TimerControls from "./TimerControls"

const createHandlers = () => ({
  handleTimerInputChange: mock((_e: ChangeEvent<HTMLInputElement>) => {}),
  handleStartClick: mock(() => {}),
  handleStartBreakClick: mock(() => {}),
  handleStartLongBreakClick: mock(() => {}),
  handlePauseClick: mock(() => {}),
  handleResumeClick: mock(() => {}),
  handleResetClick: mock(() => {}),
})

afterEach(() => {
  cleanup()
  mock.restore()
})

describe("TimerControls", () => {
  it("renders the controls container", () => {
    const { container } = render(
      <TimerControls status="IDLE" handlers={createHandlers()} />
    )

    expect(container.querySelector(".controls")).not.toBeNull()
  })

  it("renders IDLE buttons and calls their handlers", () => {
    const handlers = createHandlers()

    render(<TimerControls status="IDLE" handlers={handlers} />)

    fireEvent.click(screen.getByRole("button", { name: "Start" }))
    fireEvent.click(screen.getByRole("button", { name: "Break" }))
    fireEvent.click(screen.getByRole("button", { name: "Long Break" }))

    expect(handlers.handleStartClick).toHaveBeenCalledTimes(1)
    expect(handlers.handleStartBreakClick).toHaveBeenCalledTimes(1)
    expect(handlers.handleStartLongBreakClick).toHaveBeenCalledTimes(1)
  })

  it("renders RUNNING buttons and calls their handlers", () => {
    const handlers = createHandlers()

    render(<TimerControls status="RUNNING" handlers={handlers} />)

    fireEvent.click(screen.getByRole("button", { name: "Pause" }))
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))

    expect(handlers.handlePauseClick).toHaveBeenCalledTimes(1)
    expect(handlers.handleResetClick).toHaveBeenCalledTimes(1)
  })

  it("renders PAUSED buttons and calls their handlers", () => {
    const handlers = createHandlers()

    render(<TimerControls status="PAUSED" handlers={handlers} />)

    fireEvent.click(screen.getByRole("button", { name: "Resume" }))
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))

    expect(handlers.handleResumeClick).toHaveBeenCalledTimes(1)
    expect(handlers.handleResetClick).toHaveBeenCalledTimes(1)
  })

  it("renders only the container for unsupported status", () => {
    const { container } = render(
      <TimerControls status={"COMPLETE" as never} handlers={createHandlers()} />
    )

    expect(container.querySelector(".controls")).not.toBeNull()
    expect(screen.queryByRole("button")).toBeNull()
  })
})
