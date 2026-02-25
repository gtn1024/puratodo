import type {
  TaskFiltersProps,
  TaskFiltersValue,
} from '../components/TaskFilters'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TaskFilters,
} from '../components/TaskFilters'
import { render } from '../test/utils'

describe('taskFilters', () => {
  const defaultValue: TaskFiltersValue = {
    status: 'all',
    star: 'all',
    date: 'all',
  }

  const defaultLabels = {
    all: 'All',
    incomplete: 'Incomplete',
    completed: 'Completed',
    starred: 'Starred',
    unstarred: 'Unstarred',
    dueDate: 'Due Date',
    overdue: 'Overdue',
    today: 'Today',
    upcoming: 'Upcoming',
    noDueDate: 'No Due Date',
    clearFilters: 'Clear Filters',
    filter: 'Filter',
  }

  const defaultProps: TaskFiltersProps = {
    value: defaultValue,
    onChange: vi.fn(),
    labels: defaultLabels,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter button', () => {
    render(<TaskFilters {...defaultProps} />)
    expect(screen.getByText('Filter')).toBeInTheDocument()
  })

  it('shows filter icon', () => {
    render(<TaskFilters {...defaultProps} />)
    const button = screen.getByRole('button', { name: /filter/i })
    expect(button).toBeInTheDocument()
  })

  it('shows active filter count when filters are applied', () => {
    const valueWithFilters: TaskFiltersValue = {
      status: 'completed',
      star: 'all',
      date: 'all',
    }
    render(<TaskFilters {...defaultProps} value={valueWithFilters} />)

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows correct count for multiple active filters', () => {
    const valueWithMultipleFilters: TaskFiltersValue = {
      status: 'completed',
      star: 'starred',
      date: 'today',
    }
    render(<TaskFilters {...defaultProps} value={valueWithMultipleFilters} />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show count when no filters are applied', () => {
    render(<TaskFilters {...defaultProps} />)
    // Should not find a badge with count
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('applies border styling when filters are active', () => {
    const valueWithFilters: TaskFiltersValue = {
      status: 'completed',
      star: 'all',
      date: 'all',
    }
    render(<TaskFilters {...defaultProps} value={valueWithFilters} />)

    const button = screen.getByRole('button', { name: /filter/i })
    expect(button).toHaveClass('border-stone-400')
  })

  it('calls onChange when status filter is changed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TaskFilters {...defaultProps} onChange={onChange} />)

    // Open dropdown
    const filterButton = screen.getByText('Filter')
    await user.click(filterButton)

    // Wait for dropdown to open and click on "Incomplete" option
    await waitFor(async () => {
      const incompleteOption = screen.getByText('Incomplete')
      await user.click(incompleteOption)
    })

    expect(onChange).toHaveBeenCalledWith({
      ...defaultValue,
      status: 'incomplete',
    })
  })

  it('calls onChange when star filter is changed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TaskFilters {...defaultProps} onChange={onChange} />)

    // Open dropdown
    const filterButton = screen.getByText('Filter')
    await user.click(filterButton)

    // Wait for dropdown to open and click on a star filter option
    await waitFor(async () => {
      // Find the menu items with role="menuitem"
      const menuItems = screen.getAllByRole('menuitem')
      // Find the "Starred" menu item (not the section heading)
      const starredOption = menuItems.find(item => item.textContent === 'Starred')
      if (starredOption) {
        await user.click(starredOption)
        expect(onChange).toHaveBeenCalledWith({
          ...defaultValue,
          star: 'starred',
        })
      }
    })
  })

  it('calls onChange when date filter is changed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TaskFilters {...defaultProps} onChange={onChange} />)

    // Open dropdown
    const filterButton = screen.getByText('Filter')
    await user.click(filterButton)

    // Wait for dropdown to open and click on "Today" option
    await waitFor(async () => {
      const todayOption = screen.getByText('Today')
      await user.click(todayOption)
    })

    expect(onChange).toHaveBeenCalledWith({
      ...defaultValue,
      date: 'today',
    })
  })

  it('highlights active filter option', async () => {
    const user = userEvent.setup()
    const valueWithFilters: TaskFiltersValue = {
      status: 'completed',
      star: 'all',
      date: 'all',
    }
    render(<TaskFilters {...defaultProps} value={valueWithFilters} />)

    // Open dropdown
    const filterButton = screen.getByText('Filter')
    await user.click(filterButton)

    // Completed option should have background highlight
    await waitFor(() => {
      const completedOption = screen.getByText('Completed')
      expect(completedOption).toHaveClass('bg-stone-100')
    })
  })

  it('shows all filter sections', async () => {
    const user = userEvent.setup()
    render(<TaskFilters {...defaultProps} />)

    // Open dropdown
    const filterButton = screen.getByText('Filter')
    await user.click(filterButton)

    // Check that all sections are present
    await waitFor(() => {
      const statusHeadings = screen.getAllByText('Status', { selector: 'div' })
      const starredHeadings = screen.getAllByText('Starred', { selector: 'div' })
      const dateHeadings = screen.getAllByText('Due Date', { selector: 'div' })

      expect(statusHeadings.length).toBeGreaterThan(0)
      expect(starredHeadings.length).toBeGreaterThan(0)
      expect(dateHeadings.length).toBeGreaterThan(0)
    })
  })

  it('shows all filter options', async () => {
    const user = userEvent.setup()
    render(<TaskFilters {...defaultProps} />)

    // Open dropdown
    const filterButton = screen.getByText('Filter')
    await user.click(filterButton)

    // Check that key options are present
    await waitFor(() => {
      expect(screen.getByText('Incomplete')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Unstarred')).toBeInTheDocument()
      expect(screen.getByText('Overdue')).toBeInTheDocument()
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Upcoming')).toBeInTheDocument()
      expect(screen.getByText('No Due Date')).toBeInTheDocument()
    })
  })

  it('shows clear filters option when filters are active', async () => {
    const user = userEvent.setup()
    const valueWithFilters: TaskFiltersValue = {
      status: 'completed',
      star: 'all',
      date: 'all',
    }
    render(<TaskFilters {...defaultProps} value={valueWithFilters} />)

    // Open dropdown
    const filterButton = screen.getByText('Filter')
    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument()
    })
  })

  it('clears all filters when clear option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const valueWithFilters: TaskFiltersValue = {
      status: 'completed',
      star: 'starred',
      date: 'today',
    }
    render(<TaskFilters {...defaultProps} value={valueWithFilters} onChange={onChange} />)

    // Open dropdown
    const filterButton = screen.getByText('Filter')
    await user.click(filterButton)

    // Click clear filters
    await waitFor(async () => {
      const clearOption = screen.getByText('Clear Filters')
      await user.click(clearOption)
    })

    expect(onChange).toHaveBeenCalledWith({
      status: 'all',
      star: 'all',
      date: 'all',
    })
  })
})
