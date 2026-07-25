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
})
