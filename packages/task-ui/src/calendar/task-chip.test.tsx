import type { CalendarTask } from './types'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '../test/utils'
import { TaskChip } from './task-chip'

describe('taskChip', () => {
  const mockTask: CalendarTask = {
    id: 'task-1',
    name: 'Test Task',
    completed: false,
    starred: false,
    list_name: 'List 1',
    list_icon: '📋',
    group_name: 'Group 1',
    group_color: '#3b82f6',
  }

  it('renders task name', () => {
    render(<TaskChip task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('shows incomplete icon for incomplete task', () => {
    const { container } = render(<TaskChip task={mockTask} />)
    const circleIcon = container.querySelector('.lucide-circle')
    expect(circleIcon).toBeInTheDocument()
  })

  it('shows completed icon for completed task', () => {
    const completedTask = { ...mockTask, completed: true }
    const { container } = render(<TaskChip task={completedTask} />)
    // Check for CircleCheck icon (lucide-react converts CheckCircle2 to lucide-circle-check)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('lucide-circle-check')
  })

  it('shows star icon for starred task', () => {
    const starredTask = { ...mockTask, starred: true }
    const { container } = render(<TaskChip task={starredTask} />)
    const starIcon = container.querySelector('.lucide-star')
    expect(starIcon).toBeInTheDocument()
  })

  it('does not show star icon for unstarred task', () => {
    const { container } = render(<TaskChip task={mockTask} />)
    const starIcon = container.querySelector('.lucide-star')
    expect(starIcon).not.toBeInTheDocument()
  })

  it('applies strikethrough to completed task name', () => {
    const completedTask = { ...mockTask, completed: true }
    const { container } = render(<TaskChip task={completedTask} />)
    const taskName = screen.getByText('Test Task')
    expect(taskName).toHaveClass('line-through')
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<TaskChip task={mockTask} onSelect={onSelect} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(onSelect).toHaveBeenCalledWith(mockTask)
  })

  it('applies selected styling when isSelected is true', () => {
    const { container } = render(<TaskChip task={mockTask} isSelected />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-accent')
  })

  it('does not apply selected styling when isSelected is false', () => {
    render(<TaskChip task={mockTask} isSelected={false} />)
    const button = screen.getByRole('button')
    expect(button).not.toHaveClass('bg-accent')
  })
})
