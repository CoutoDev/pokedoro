import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { initialCollectionFilters, type CollectionFilterState } from '../../filterCollection'
import CollectionFilters from './CollectionFilters'

afterEach(() => {
  cleanup()
  mock.restore()
})

const setup = (filters: CollectionFilterState = initialCollectionFilters, count = 151) => {
  const onChange = mock((_f: CollectionFilterState) => {})
  render(<CollectionFilters filters={filters} onChange={onChange} resultCount={count} />)
  return onChange
}

describe('CollectionFilters', () => {
  it('renders status buttons and marks the active one as pressed', () => {
    setup({ ...initialCollectionFilters, status: 'caught' })

    expect(screen.getByRole('button', { name: 'Caught' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('emits the full filter state when the status changes', () => {
    const onChange = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Uncaught' }))
    expect(onChange).toHaveBeenCalledWith({ ...initialCollectionFilters, status: 'uncaught' })
  })

  it('emits search, type and rarity changes', () => {
    const onChange = setup()

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'char' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...initialCollectionFilters, search: 'char' })

    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'water' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...initialCollectionFilters, type: 'water' })

    fireEvent.change(screen.getByLabelText('Rarity'), { target: { value: 'rare' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...initialCollectionFilters, rarity: 'rare' })
  })

  it('shows the result count and hides Clear filters when nothing is active', () => {
    setup(initialCollectionFilters, 151)
    expect(screen.getByRole('status').textContent).toBe('151 Pokémon found')
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
  })

  it('resets everything via Clear filters', () => {
    const onChange = setup({ ...initialCollectionFilters, search: 'x', type: 'fire' }, 0)
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onChange).toHaveBeenCalledWith(initialCollectionFilters)
  })
})
