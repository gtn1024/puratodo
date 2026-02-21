import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../test/utils'
import { TaskItem, TaskItemProps, TaskWithSubtasks } from '../components/TaskItem'

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}))

describe('TaskItem', () => {
  const mockTask: TaskWithSubtasks = {
    id: 'task-1',
    name: 'Test Task',
    completed: false,
    starred: false,
    list_id: 'list-1',
    user_id: 'user-1',
    sort_order: 0,
    subtasks: [],
  }

  const defaultProps: TaskItemProps = {
    task: mockTask,
    level: 0,
    expandedTasks: new Set(),
    onToggleExpand: vi.fn(),
    onToggleComplete: vi.fn(),
    onToggleStar: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddSubtask: vi.fn(),
    onOpenDetail: vi.fn(),
    editingTaskId: null,
    editName: '',
    onEditNameChange: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    renderSubtasks: vi.fn(() => null),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders task name correctly', () => {
    render(<TaskItem {...defaultProps} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox is clicked', async () => {
    const onToggleComplete = vi.fn()
    render(<TaskItem {...defaultProps} onToggleComplete={onToggleComplete} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onToggleComplete).toHaveBeenCalledWith(mockTask)
  })

  it('calls onOpenDetail when task name is clicked', () => {
    const onOpenDetail = vi.fn()
    render(<TaskItem {...defaultProps} onOpenDetail={onOpenDetail} />)

    const taskName = screen.getByText('Test Task')
    fireEvent.click(taskName)

    expect(onOpenDetail).toHaveBeenCalledWith(mockTask)
  })

  it('shows star icon with correct styling when task is starred', () => {
    const starredTask = { ...mockTask, starred: true }
    render(<TaskItem {...defaultProps} task={starredTask} />)

    // Star button should have opacity-100 class when starred
    const buttons = screen.getAllByRole('button')
    const starButton = buttons.find(btn => btn.querySelector('svg.lucide-star'))
    expect(starButton).toHaveClass('opacity-100')
    expect(starButton).toHaveClass('text-yellow-500')
  })

  it('shows completed styling when task is completed', () => {
    const completedTask = { ...mockTask, completed: true }
    render(<TaskItem {...defaultProps} task={completedTask} />)

    const taskName = screen.getByText('Test Task')
    expect(taskName).toHaveClass('line-through')
  })

  it('shows expand button when task has subtasks', () => {
    const taskWithSubtasks = {
      ...mockTask,
      subtasks: [{ ...mockTask, id: 'subtask-1', name: 'Subtask 1' }],
    }
    render(<TaskItem {...defaultProps} task={taskWithSubtasks} />)

    // Expand button should be visible (has opacity-100 class)
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find(btn =>
      btn.querySelector('svg.lucide-chevron-right') || btn.querySelector('svg.lucide-chevron-down')
    )
    expect(expandButton).toBeInTheDocument()
    expect(expandButton).toHaveClass('opacity-100')
  })

  it('calls onToggleExpand when expand button is clicked', () => {
    const onToggleExpand = vi.fn()
    const taskWithSubtasks = {
      ...mockTask,
      subtasks: [{ ...mockTask, id: 'subtask-1', name: 'Subtask 1' }],
    }
    render(
      <TaskItem
        {...defaultProps}
        task={taskWithSubtasks}
        onToggleExpand={onToggleExpand}
      />
    )

    // Find the expand button (chevron icon button)
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find(
      (btn) => btn.querySelector('svg.lucide-chevron-right') || btn.querySelector('svg.lucide-chevron-down')
    )

    if (expandButton) {
      fireEvent.click(expandButton)
      expect(onToggleExpand).toHaveBeenCalledWith('task-1')
    }
  })

  it('shows selection checkbox in selection mode', () => {
    render(
      <TaskItem {...defaultProps} isSelectionMode={true} isSelected={false} />
    )

    // Should show Square icon (unselected state) for selection
    const buttons = screen.getAllByRole('button')
    const selectButton = buttons.find(btn => btn.querySelector('svg.lucide-square'))
    expect(selectButton).toBeInTheDocument()
  })

  it('shows checked selection checkbox when selected', () => {
    const onToggleSelect = vi.fn()
    render(
      <TaskItem
        {...defaultProps}
        isSelectionMode={true}
        isSelected={true}
        onToggleSelect={onToggleSelect}
      />
    )

    // Find the CheckSquare icon button (selected state)
    // The button should contain a SVG with class containing 'lucide-check-square'
    const buttons = screen.getAllByRole('button')
    // Look for the button that has blue-500 text color (selected state)
    const selectButton = buttons.find(btn =>
      btn.querySelector('svg.text-blue-500') || btn.querySelector('svg.lucide-check-square')
    )
    expect(selectButton).toBeTruthy()
    expect(selectButton?.querySelector('svg')).toBeTruthy()
  })

  it('renders in editing mode when editingTaskId matches', () => {
    render(
      <TaskItem
        {...defaultProps}
        editingTaskId="task-1"
        editName="Edited Task"
      />
    )

    const input = screen.getByDisplayValue('Edited Task')
    expect(input).toBeInTheDocument()
  })

  it('calls onSaveEdit when Enter is pressed in edit mode', () => {
    const onSaveEdit = vi.fn()
    render(
      <TaskItem
        {...defaultProps}
        editingTaskId="task-1"
        editName="Edited Task"
        onSaveEdit={onSaveEdit}
      />
    )

    const input = screen.getByDisplayValue('Edited Task')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSaveEdit).toHaveBeenCalled()
  })

  it('calls onCancelEdit when Escape is pressed in edit mode', () => {
    const onCancelEdit = vi.fn()
    render(
      <TaskItem
        {...defaultProps}
        editingTaskId="task-1"
        editName="Edited Task"
        onCancelEdit={onCancelEdit}
      />
    )

    const input = screen.getByDisplayValue('Edited Task')
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(onCancelEdit).toHaveBeenCalled()
  })

  it('shows context metadata when provided', () => {
    const contextMeta = {
      listName: 'My List',
      listIcon: '📝',
      groupName: 'My Group',
      groupColor: '#ff0000',
    }
    render(<TaskItem {...defaultProps} contextMeta={contextMeta} />)

    expect(screen.getByText('My List')).toBeInTheDocument()
    expect(screen.getByText('My Group')).toBeInTheDocument()
  })
})
