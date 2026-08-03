import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import CollectionPagination from './CollectionPagination'

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('CollectionPagination', () => {
  it('shows the current page and total pages', () => {
    render(<CollectionPagination page={2} totalPages={5} onPrevious={() => {}} onNext={() => {}} />)

    expect(screen.getByText('Page 2 of 5')).not.toBeNull()
  })

  it('disables Previous on the first page and Next on the last page', () => {
    const { rerender } = render(
      <CollectionPagination page={1} totalPages={3} onPrevious={() => {}} onNext={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveProperty('disabled', false)

    rerender(<CollectionPagination page={3} totalPages={3} onPrevious={() => {}} onNext={() => {}} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveProperty('disabled', false)
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveProperty('disabled', true)
  })

  it('calls onPrevious and onNext when clicked', () => {
    const onPrevious = mock(() => {})
    const onNext = mock(() => {})
    render(<CollectionPagination page={2} totalPages={3} onPrevious={onPrevious} onNext={onNext} />)

    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
