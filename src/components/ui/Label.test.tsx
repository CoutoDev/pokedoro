import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'

import { Label } from './Label'

afterEach(() => {
  cleanup()
})

describe('Label', () => {
  it('renders its children and associates with a field via htmlFor', () => {
    render(
      <>
        <Label htmlFor="field">My Field</Label>
        <input id="field" />
      </>,
    )

    expect(screen.getByLabelText('My Field')).not.toBeNull()
  })

  it('merges a custom className', () => {
    render(<Label className="extra-class">Text</Label>)

    expect(screen.getByText('Text').className).toContain('extra-class')
  })
})
