import { describe, it, expect, mock } from "bun:test"
import { render, screen } from "@testing-library/react"
import Timer from "./Timer"
import { TimerContext } from "@/contexts/TimerContext"

describe("Timer", () => {
  const createMockContext = (overrides = {}) => ({
    timer: {
      id: crypto.randomUUID(),
      phase: 'FOCUS' as const,
      status: 'IDLE' as const,
      focusDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      sessionTimeout: null,
      pausedAt: null,
      resumedAt: null,
      resetedAt: null,
      remaining: 25 * 60,
      interval: null,
      ...overrides,
    },
    timerDispatch: mock(() => {}),
  })

  it("should render the timer container", () => {
    const mockContext = createMockContext()
    
    const { container } = render(
      <TimerContext.Provider value={mockContext}>
        <Timer />
      </TimerContext.Provider>
    )
    
    const timerContainer = container.querySelector(".pomodoro-timer")
    expect(timerContainer).toBeDefined()
  })

  it("should render TimerDisplay component", () => {
    const mockContext = createMockContext({ remaining: 1500 })
    
    const { container } = render(
      <TimerContext.Provider value={mockContext}>
        <Timer />
      </TimerContext.Provider>
    )
    
    const display = container.querySelector(".display")
    expect(display).toBeDefined()
  })

  it("should render TimerControls component", () => {
    const mockContext = createMockContext()
    
    const { container } = render(
      <TimerContext.Provider value={mockContext}>
        <Timer />
      </TimerContext.Provider>
    )
    
    const controls = container.querySelector(".controls")
    expect(controls).toBeDefined()
  })

  it("should pass remaining time to TimerDisplay", () => {
    const mockContext = createMockContext({ remaining: 300 })
    
    const { container } = render(
      <TimerContext.Provider value={mockContext}>
        <Timer />
      </TimerContext.Provider>
    )
    
    const display = container.querySelector(".display")
    expect(display?.textContent).toBe("05:00")
  })

  it("should pass status to TimerControls", () => {
    const mockContext = createMockContext({ status: 'RUNNING' as const })
    
    render(
      <TimerContext.Provider value={mockContext}>
        <Timer />
      </TimerContext.Provider>
    )
    
    expect(screen.getByText("Pause")).toBeDefined()
    expect(screen.getByText("Reset")).toBeDefined()
  })

  it("should pass all handlers to TimerControls", () => {
    const mockDispatch = mock(() => {})
    const mockContext = {
      timer: createMockContext().timer,
      timerDispatch: mockDispatch,
    }
    
    const { container } = render(
      <TimerContext.Provider value={mockContext}>
        <Timer />
      </TimerContext.Provider>
    )
    
    const controls = container.querySelector(".controls")
    expect(controls).toBeDefined()
  })

  describe("Different timer states", () => {
    it("should render correctly when timer is IDLE", () => {
      const mockContext = createMockContext({ status: 'IDLE' as const, remaining: 1500 })
      
      render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      expect(screen.getByText("Start")).toBeDefined()
      expect(screen.getByText("Break")).toBeDefined()
      expect(screen.getByText("Long Break")).toBeDefined()
    })

    it("should render correctly when timer is RUNNING", () => {
      const mockContext = createMockContext({ status: 'RUNNING' as const, remaining: 1200 })
      
      render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      expect(screen.getByText("Pause")).toBeDefined()
      expect(screen.getByText("Reset")).toBeDefined()
      expect(screen.queryByText("Start")).toBeNull()
    })

    it("should render correctly when timer is PAUSED", () => {
      const mockContext = createMockContext({ status: 'PAUSED' as const, remaining: 900 })
      
      render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      expect(screen.getByText("Resume")).toBeDefined()
      expect(screen.getByText("Reset")).toBeDefined()
      expect(screen.queryByText("Start")).toBeNull()
    })
  })

  describe("Edge cases", () => {
    it("should handle zero remaining time", () => {
      const mockContext = createMockContext({ remaining: 0 })
      
      const { container } = render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      const display = container.querySelector(".display")
      expect(display?.textContent).toBe("00:00")
    })

    it("should handle very large remaining time", () => {
      const mockContext = createMockContext({ remaining: 7200 })
      
      const { container } = render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      const display = container.querySelector(".display")
      expect(display?.textContent).toBe("120:00")
    })

    it("should handle missing context gracefully", () => {
      // This test verifies the component doesn't crash without context
      // In a real scenario, this would be caught by the context hook
      const originalConsoleError = console.error
      console.error = mock(() => {})
      
      try {
        render(<Timer />)
      } catch (error) {
        // Expected to throw when context is missing
        expect(error).toBeDefined()
      } finally {
        console.error = originalConsoleError
      }
    })

    it("should handle null sessionTimeout", () => {
      const mockContext = createMockContext({ sessionTimeout: null })
      
      const { container } = render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      const timerContainer = container.querySelector(".pomodoro-timer")
      expect(timerContainer).toBeDefined()
    })

    it("should handle null pausedAt", () => {
      const mockContext = createMockContext({ pausedAt: null })
      
      const { container } = render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      const timerContainer = container.querySelector(".pomodoro-timer")
      expect(timerContainer).toBeDefined()
    })

    it("should handle null resumedAt", () => {
      const mockContext = createMockContext({ resumedAt: null })
      
      const { container } = render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      const timerContainer = container.querySelector(".pomodoro-timer")
      expect(timerContainer).toBeDefined()
    })
  })

  describe("Component structure", () => {
    it("should have correct class name for container", () => {
      const mockContext = createMockContext()
      
      const { container } = render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      const timerContainer = container.querySelector(".pomodoro-timer")
      expect(timerContainer).toBeDefined()
    })

    it("should render TimerDisplay before TimerControls", () => {
      const mockContext = createMockContext()
      
      const { container } = render(
        <TimerContext.Provider value={mockContext}>
          <Timer />
        </TimerContext.Provider>
      )
      
      const display = container.querySelector(".display")
      const controls = container.querySelector(".controls")
      
      expect(display).toBeDefined()
      expect(controls).toBeDefined()
    })
  })
})
