import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryDropdown from './CategoryDropdown'
import type { Category } from '@/lib/types'

const categories: Category[] = [
  { id: 1, name: 'Personal', color: '#F5D79E' },
  { id: 2, name: 'School', color: '#7BBFBB' },
  { id: 3, name: 'Drama', color: '#B8D4B0' },
]

describe('CategoryDropdown', () => {
  it('renders the default trigger with "No category" when nothing selected', () => {
    render(<CategoryDropdown categories={categories} onSelect={vi.fn()} />)
    expect(screen.getByText('No category')).toBeInTheDocument()
  })

  it('renders the selected category name in the trigger', () => {
    render(<CategoryDropdown categories={categories} selected={categories[0]} onSelect={vi.fn()} />)
    expect(screen.getByText('Personal')).toBeInTheDocument()
  })

  it('opens the menu when trigger is clicked', async () => {
    render(<CategoryDropdown categories={categories} onSelect={vi.fn()} />)
    await userEvent.click(screen.getByText('No category'))
    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.getByText('School')).toBeInTheDocument()
  })

  it('filters out the selected category from the menu', async () => {
    render(<CategoryDropdown categories={categories} selected={categories[0]} onSelect={vi.fn()} />)
    await userEvent.click(screen.getByText('Personal'))
    expect(screen.queryAllByText('Personal')).toHaveLength(1) // only in trigger, not in menu
    expect(screen.getByText('School')).toBeInTheDocument()
  })

  it('calls onSelect with the chosen category', async () => {
    const onSelect = vi.fn()
    render(<CategoryDropdown categories={categories} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('No category'))
    await userEvent.click(screen.getByText('School'))
    expect(onSelect).toHaveBeenCalledWith(categories[1])
  })

  it('closes the menu after selecting', async () => {
    render(<CategoryDropdown categories={categories} onSelect={vi.fn()} />)
    await userEvent.click(screen.getByText('No category'))
    await userEvent.click(screen.getByText('School'))
    expect(screen.queryByText('Drama')).not.toBeInTheDocument()
  })

  it('renders a custom trigger when provided', () => {
    render(
      <CategoryDropdown
        categories={categories}
        onSelect={vi.fn()}
        trigger={<button>Custom Trigger</button>}
      />
    )
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument()
    expect(screen.queryByText('No category')).not.toBeInTheDocument()
  })
})
