import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import CatchReveal from './CatchReveal'

afterEach(() => {
  cleanup()
})

describe('CatchReveal', () => {
  it('renders nothing when there is no catch, nudge, or error to show', () => {
    const { container } = render(
      <CatchReveal caughtPokemon={null} showLoginNudge={false} error={null} onDismiss={() => {}} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('displays the caught Pokemon sprite, name, and rarity', () => {
    render(
      <CatchReveal
        caughtPokemon={{ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' }}
        showLoginNudge={false}
        error={null}
        onDismiss={() => {}}
      />,
    )

    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByText('Caught!')).not.toBeNull()
    expect(screen.getByText('Pikachu')).not.toBeNull()
    expect(screen.getByText('common')).not.toBeNull()
    expect(screen.getByAltText('Pikachu')).not.toBeNull()
  })

  it('does not render caught content when the species id has no matching static data', () => {
    render(
      <CatchReveal
        caughtPokemon={{ speciesId: 9999, caughtAt: '2026-01-01T00:00:00.000Z' }}
        showLoginNudge={false}
        error={null}
        onDismiss={() => {}}
      />,
    )

    expect(screen.queryByText('Caught!')).toBeNull()
  })

  it('dismisses on "Got it!" button click', () => {
    const onDismiss = mock(() => {})
    render(
      <CatchReveal
        caughtPokemon={{ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' }}
        showLoginNudge={false}
        error={null}
        onDismiss={onDismiss}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /got it/i }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows the login nudge message and sign-in button for guests', () => {
    const onDismiss = mock(() => {})
    render(
      <CatchReveal caughtPokemon={null} showLoginNudge={true} error={null} onDismiss={onDismiss} />,
    )

    expect(screen.getByText(/sign in to catch pokémon/i)).not.toBeNull()
    const button = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(button)

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows the error message and "Try again" button', () => {
    const onDismiss = mock(() => {})
    render(
      <CatchReveal caughtPokemon={null} showLoginNudge={false} error="Couldn't catch it — try again" onDismiss={onDismiss} />,
    )

    expect(screen.getByRole('heading', { name: "Couldn't catch it" })).not.toBeNull()
    expect(screen.getByText("Couldn't catch it — try again")).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('dismisses on ESC key press', () => {
    const onDismiss = mock(() => {})
    render(
      <CatchReveal
        caughtPokemon={{ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' }}
        showLoginNudge={false}
        error={null}
        onDismiss={onDismiss}
      />,
    )

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('ignores non-Escape key presses', () => {
    const onDismiss = mock(() => {})
    render(
      <CatchReveal
        caughtPokemon={{ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' }}
        showLoginNudge={false}
        error={null}
        onDismiss={onDismiss}
      />,
    )

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' })

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on the native dialog cancel event', () => {
    const onDismiss = mock(() => {})
    render(
      <CatchReveal
        caughtPokemon={{ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' }}
        showLoginNudge={false}
        error={null}
        onDismiss={onDismiss}
      />,
    )

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('closes the dialog once all three reveal states clear', () => {
    const { rerender, container } = render(
      <CatchReveal
        caughtPokemon={{ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' }}
        showLoginNudge={false}
        error={null}
        onDismiss={() => {}}
      />,
    )
    expect(screen.getByRole('dialog')).not.toBeNull()

    rerender(<CatchReveal caughtPokemon={null} showLoginNudge={false} error={null} onDismiss={() => {}} />)

    expect(container.firstChild).toBeNull()
  })
})
