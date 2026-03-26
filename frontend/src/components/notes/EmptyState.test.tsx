import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders the waiting message', () => {
    render(<EmptyState />)
    expect(screen.getByText(/waiting for your charming notes/i)).toBeInTheDocument()
  })

  it('renders the coffee image', () => {
    render(<EmptyState />)
    expect(screen.getByAltText('Coffee')).toBeInTheDocument()
  })
})
