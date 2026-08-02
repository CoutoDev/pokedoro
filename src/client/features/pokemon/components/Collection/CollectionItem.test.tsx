import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { pokemonSpecies } from '@/shared/data/pokemonSpecies'

import CollectionItem from './CollectionItem'

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('CollectionItem', () => {
  const pikachu = pokemonSpecies.find((s) => s.id === 25)!

  it('displays the species sprite, name, rarity, and catch count', () => {
    render(<CollectionItem pokemon={pikachu} count={3} handleCloseModal={() => {}} />)

    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByText('Pikachu')).not.toBeNull()
    expect(screen.getByText('common')).not.toBeNull()
    expect(screen.getByAltText('Pikachu')).not.toBeNull()
    expect(screen.getByText('x3')).not.toBeNull()
  })

  it('closes on the close button click', () => {
    const handleCloseModal = mock(() => {})
    render(<CollectionItem pokemon={pikachu} count={1} handleCloseModal={handleCloseModal} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(handleCloseModal).toHaveBeenCalledTimes(1)
  })

  it('closes on ESC key press', () => {
    const handleCloseModal = mock(() => {})
    render(<CollectionItem pokemon={pikachu} count={1} handleCloseModal={handleCloseModal} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(handleCloseModal).toHaveBeenCalledTimes(1)
  })
})
