import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { Dialog } from './Dialog'

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Dialog open={false} onClose={() => {}}>content</Dialog>,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders children with role dialog when open', () => {
    render(
      <Dialog open onClose={() => {}}>
        <p>Hello</p>
      </Dialog>,
    )

    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByText('Hello')).not.toBeNull()
  })

  it('forwards the id and merges a custom className', () => {
    render(
      <Dialog open onClose={() => {}} id="my-modal" className="extra-class">
        content
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog.id).toBe('my-modal')
    expect(dialog.className).toContain('extra-class')
  })

  it('calls onClose on Escape key press', () => {
    const onClose = mock(() => {})
    render(
      <Dialog open onClose={onClose}>content</Dialog>,
    )

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores non-Escape key presses', () => {
    const onClose = mock(() => {})
    render(
      <Dialog open onClose={onClose}>content</Dialog>,
    )

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on the native dialog cancel event', () => {
    const onClose = mock(() => {})
    render(
      <Dialog open onClose={onClose}>content</Dialog>,
    )

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes the dialog once open turns false', () => {
    const { rerender, container } = render(
      <Dialog open onClose={() => {}}>content</Dialog>,
    )
    expect(screen.getByRole('dialog')).not.toBeNull()

    rerender(<Dialog open={false} onClose={() => {}}>content</Dialog>)

    expect(container.firstChild).toBeNull()
  })
})
