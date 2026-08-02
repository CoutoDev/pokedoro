import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { pokemonSpecies } from '@/shared/data/pokemonSpecies'

import CollectionGrid from './CollectionGrid'

afterEach(() => {
  cleanup()
})

describe('CollectionGrid', () => {
  it('renders all 151 species', () => {
    const { container } = render(<CollectionGrid catches={[]} handleSpeciesClick={() => {}} />)

    expect(container.querySelectorAll('.grid > div')).toHaveLength(151)
  })

  it('renders uncaught species as a greyed placeholder with a padded dex number', () => {
    render(<CollectionGrid catches={[]} handleSpeciesClick={() => {}} />)

    expect(screen.getByText('#001')).not.toBeNull()
    expect(screen.getByText('#151')).not.toBeNull()
  })

  it('renders a caught species with its sprite and name', () => {
    render(
      <CollectionGrid
        catches={[{ speciesId: 25, count: 1, lastCaughtAt: '2026-01-01T00:00:00.000Z' }]}
        handleSpeciesClick={() => {}}
      />,
    )

    const pikachu = pokemonSpecies.find((s) => s.id === 25)!
    expect(screen.getByAltText('Pikachu')).not.toBeNull()
    expect(screen.getByText('Pikachu')).not.toBeNull()
    expect(screen.getByAltText('Pikachu')).toHaveProperty('src', pikachu.spriteUrl)
  })

  it('shows a count badge only when caught more than once', () => {
    const { rerender } = render(
      <CollectionGrid catches={[{ speciesId: 25, count: 1, lastCaughtAt: '2026-01-01T00:00:00.000Z' }]} handleSpeciesClick={() => {}} />,
    )
    expect(screen.queryByText('1')).toBeNull()

    rerender(
      <CollectionGrid catches={[{ speciesId: 25, count: 3, lastCaughtAt: '2026-01-01T00:00:00.000Z' }]} handleSpeciesClick={() => {}} />,
    )
    expect(screen.getByText('3')).not.toBeNull()
  })

  it('keeps species in dex order regardless of catch order', () => {
    const { container } = render(
      <CollectionGrid
        catches={[
          { speciesId: 3, count: 1, lastCaughtAt: '2026-01-01T00:00:00.000Z' },
          { speciesId: 1, count: 1, lastCaughtAt: '2026-01-01T00:00:00.000Z' },
        ]}
        handleSpeciesClick={() => {}}
      />,
    )

    const names = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('alt'))
    expect(names[0]).toBe('Bulbasaur')
  })

  it('calls handleSpeciesClick with the species and count when a caught entry is clicked', () => {
    const handleSpeciesClick = mock((_species: unknown, _count: number) => {})
    render(
      <CollectionGrid
        catches={[{ speciesId: 25, count: 2, lastCaughtAt: '2026-01-01T00:00:00.000Z' }]}
        handleSpeciesClick={handleSpeciesClick}
      />,
    )

    fireEvent.click(screen.getByText('Pikachu').closest('div')!)

    const pikachu = pokemonSpecies.find((s) => s.id === 25)!
    expect(handleSpeciesClick).toHaveBeenCalledWith(pikachu, 2)
  })
})
