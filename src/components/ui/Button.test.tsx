import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { Button } from './Button'

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('Button', () => {
  it('renders children and calls onClick', () => {
    const onClick = mock(() => {})
    render(<Button onClick={onClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button', { name: 'Click me' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant and size classes', () => {
    render(<Button variant="primary" size="circle">Go</Button>)

    const button = screen.getByRole('button', { name: 'Go' })
    expect(button.className).toContain('rounded-full')
  })

  it('merges a custom className with variant classes', () => {
    render(<Button className="extra-class">Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' }).className).toContain('extra-class')
  })

  it('forwards a ref to the underlying button element', () => {
    let ref: HTMLButtonElement | null = null
    render(<Button ref={(el) => { ref = el }}>Ref</Button>)

    expect(ref).toBeInstanceOf(HTMLButtonElement)
  })
})
