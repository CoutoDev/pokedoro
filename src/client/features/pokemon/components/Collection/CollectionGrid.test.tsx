import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { pokemonSpecies } from '@/shared/data/pokemonSpecies'

import CollectionGrid, { type CollectionGridItem } from './CollectionGrid'

afterEach(() => {
  cleanup()
  mock.restore()
})

const bulbasaur = pokemonSpecies.find((s) => s.id === 1)!
const pikachu = pokemonSpecies.find((s) => s.id === 25)!

describe('CollectionGrid', () => {
  it('renders exactly the given items', () => {
    const items: CollectionGridItem[] = [
      { species: bulbasaur, caught: null },
      { species: pikachu, caught: { speciesId: 25, count: 1, lastCaughtAt: '2026-01-01T00:00:00.000Z' } },
    ]
    const { container } = render(<CollectionGrid items={items} handleSpeciesClick={() => {}} />)

    expect(container.querySelectorAll('.grid > div')).toHaveLength(2)
  })

  it('renders an uncaught species as a greyed placeholder with a padded dex number', () => {
    render(<CollectionGrid items={[{ species: bulbasaur, caught: null }]} handleSpeciesClick={() => {}} />)

    expect(screen.getByText('#001')).not.toBeNull()
    expect(screen.queryByText('Bulbasaur')).toBeNull()
  })

  it('renders a caught species with its sprite and full name', () => {
    render(
      <CollectionGrid
        items={[{ species: pikachu, caught: { speciesId: 25, count: 1, lastCaughtAt: '2026-01-01T00:00:00.000Z' } }]}
        handleSpeciesClick={() => {}}
      />,
    )

    expect(screen.getByAltText('Pikachu')).not.toBeNull()
    expect(screen.getByText('Pikachu')).not.toBeNull()
    expect(screen.getByAltText('Pikachu')).toHaveProperty('src', pikachu.spriteUrl)
  })

  it('shows a count badge only when caught more than once', () => {
    const { rerender } = render(
      <CollectionGrid
        items={[{ species: pikachu, caught: { speciesId: 25, count: 1, lastCaughtAt: '2026-01-01T00:00:00.000Z' } }]}
        handleSpeciesClick={() => {}}
      />,
    )
    expect(screen.queryByText('1')).toBeNull()

    rerender(
      <CollectionGrid
        items={[{ species: pikachu, caught: { speciesId: 25, count: 3, lastCaughtAt: '2026-01-01T00:00:00.000Z' } }]}
        handleSpeciesClick={() => {}}
      />,
    )
    expect(screen.getByText('3')).not.toBeNull()
  })

  it('calls handleSpeciesClick with the species and count when a caught entry is clicked', () => {
    const handleSpeciesClick = mock((_species: unknown, _count: number) => {})
    render(
      <CollectionGrid
        items={[{ species: pikachu, caught: { speciesId: 25, count: 2, lastCaughtAt: '2026-01-01T00:00:00.000Z' } }]}
        handleSpeciesClick={handleSpeciesClick}
      />,
    )

    fireEvent.click(screen.getByText('Pikachu').closest('div')!)

    expect(handleSpeciesClick).toHaveBeenCalledWith(pikachu, 2)
  })
})
