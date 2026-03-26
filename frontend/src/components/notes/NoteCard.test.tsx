import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteCard from './NoteCard'
import type { Note } from '@/lib/types'

const baseNote: Note = {
  id: 'abc-123',
  title: 'Test Note',
  content: 'Some content here',
  category: { id: 1, name: 'Personal', color: '#F5D79E' },
  is_pinned: false,
  is_archived: false,
  created_at: '2024-06-15T12:00:00Z',
  updated_at: '2024-06-15T12:00:00Z',
}

describe('NoteCard', () => {
  it('renders the note title', () => {
    render(<NoteCard {...baseNote} onClick={vi.fn()} />)
    expect(screen.getByText('Test Note')).toBeInTheDocument()
  })

  it('renders the note content', () => {
    render(<NoteCard {...baseNote} onClick={vi.fn()} />)
    expect(screen.getByText('Some content here')).toBeInTheDocument()
  })

  it('renders the category name', () => {
    render(<NoteCard {...baseNote} onClick={vi.fn()} />)
    expect(screen.getByText('Personal')).toBeInTheDocument()
  })

  it('renders "Untitled" when title is empty', () => {
    render(<NoteCard {...baseNote} title="" onClick={vi.fn()} />)
    expect(screen.getByText('Untitled')).toBeInTheDocument()
  })

  it('does not render content when empty', () => {
    render(<NoteCard {...baseNote} content="" onClick={vi.fn()} />)
    expect(screen.queryByText('Some content here')).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<NoteCard {...baseNote} onClick={onClick} />)
    await userEvent.click(screen.getByText('Test Note'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders without a category', () => {
    render(<NoteCard {...baseNote} category={null} onClick={vi.fn()} />)
    expect(screen.getByText('Test Note')).toBeInTheDocument()
  })
})
