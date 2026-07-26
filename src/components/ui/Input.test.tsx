import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { Input } from './Input'

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('Input', () => {
  it('renders and accepts input', () => {
    const onChange = mock(() => {})
    render(<Input aria-label="Amount" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '5' } })

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('merges a custom className', () => {
    render(<Input aria-label="Amount" className="extra-class" />)

    expect(screen.getByLabelText('Amount').className).toContain('extra-class')
  })

  it('forwards a ref to the underlying input element', () => {
    let ref: HTMLInputElement | null = null
    render(<Input aria-label="Amount" ref={(el) => { ref = el }} />)

    expect(ref).toBeInstanceOf(HTMLInputElement)
  })
})
