import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import CollectionFilters from './CollectionFilters'

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('CollectionFilters', () => {
  it('renders all three filter options', () => {
    render(<CollectionFilters filter="all" onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'All' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Caught' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Uncaught' })).not.toBeNull()
  })

  it('marks the active filter as pressed', () => {
    render(<CollectionFilters filter="caught" onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Caught' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('calls onChange with the clicked filter', () => {
    const onChange = mock((_filter: string) => {})
    render(<CollectionFilters filter="all" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Uncaught' }))

    expect(onChange).toHaveBeenCalledWith('uncaught')
  })
})
