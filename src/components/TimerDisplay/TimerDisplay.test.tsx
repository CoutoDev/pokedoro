import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'

import TimerDisplay from './TimerDisplay'

afterEach(() => {
  cleanup()
})

describe('TimerDisplay', () => {
  it('renders the display container', () => {
    const { container } = render(<TimerDisplay remaining={1500} />)

    expect(container.querySelector('.display')).not.toBeNull()
  })

  it('formats remaining seconds as mm:ss', () => {
    render(<TimerDisplay remaining={1500} />)

    expect(screen.queryByText('25:00')).not.toBeNull()
  })

  it('pads minutes and seconds', () => {
    render(<TimerDisplay remaining={65} />)

    expect(screen.queryByText('01:05')).not.toBeNull()
  })

  it('does not render negative time', () => {
    render(<TimerDisplay remaining={-10} />)

    expect(screen.queryByText('00:00')).not.toBeNull()
  })

  it('supports values greater than one hour', () => {
    render(<TimerDisplay remaining={7200} />)

    expect(screen.queryByText('120:00')).not.toBeNull()
  })

  it('shows a phase caption matching the given phase', () => {
    render(<TimerDisplay remaining={300} total={300} phase="SHORT_BREAK" />)

    expect(screen.queryByText('Short break')).not.toBeNull()
  })

  it('renders a progress ring that reflects elapsed time', () => {
    const { container } = render(<TimerDisplay remaining={0} total={300} phase="LONG_BREAK" />)

    const circles = container.querySelectorAll('circle')
    const progressCircle = circles[1]!
    expect(progressCircle.getAttribute('stroke-dashoffset')).toBe('0')
  })
})
