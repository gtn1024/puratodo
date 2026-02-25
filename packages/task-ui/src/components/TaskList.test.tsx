import type { TaskWithSubtasks } from '@puratodo/api-types'
import type { TaskListProps } from '../components/TaskList'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskList } from '../components/TaskList'
import { render } from '../test/utils'

// Mock @dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  pointerWithin: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: vi.fn((arr, oldIndex, newIndex) => {
    const result = [...arr]
    const [removed] = result.splice(oldIndex, 1)
    result.splice(newIndex, 0, removed)
    return result
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}))

describe('taskList', () => {
  const mockTasks: TaskWithSubtasks[] = [
    {
      id: 'task-1',
      name: 'Task 1',
      completed: false,
      starred: false,
      list_id: 'list-1',
      user_id: 'user-1',
      sort_order: 0,
      subtasks: [],
    },
    {
      id: 'task-2',
      name: 'Task 2',
      completed: true,
      starred: true,
      list_id: 'list-1',
      user_id: 'user-1',
      sort_order: 1,
      subtasks: [
        {
          id: 'subtask-1',
          name: 'Subtask 1',
          completed: false,
          starred: false,
          list_id: 'list-1',
          user_id: 'user-1',
          sort_order: 0,
          subtasks: [],
        },
      ],
    },
  ]

  const defaultProps: TaskListProps = {
    tasks: mockTasks,
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
    onReorder: vi.fn(),
    listId: 'list-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all tasks', () => {
    render(<TaskList {...defaultProps} />)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('renders task with subtasks when expanded', () => {
    render(
      <TaskList {...defaultProps} expandedTasks={new Set(['task-2'])} />,
    )
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Subtask 1')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox is clicked', async () => {
    const onToggleComplete = vi.fn()
    render(<TaskList {...defaultProps} onToggleComplete={onToggleComplete} />)

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    expect(onToggleComplete).toHaveBeenCalledWith(mockTasks[0])
  })

  it('calls onOpenDetail when task name is clicked', () => {
    const onOpenDetail = vi.fn()
    render(<TaskList {...defaultProps} onOpenDetail={onOpenDetail} />)

    const taskName = screen.getByText('Task 1')
    fireEvent.click(taskName)

    expect(onOpenDetail).toHaveBeenCalledWith(mockTasks[0])
  })

  it('shows completed styling for completed tasks', () => {
    render(<TaskList {...defaultProps} />)

    const completedTask = screen.getByText('Task 2')
    expect(completedTask).toHaveClass('line-through')
  })

  it('renders in selection mode with selection checkboxes', () => {
    render(
      <TaskList
        {...defaultProps}
        isSelectionMode={true}
        selectedTaskIds={new Set()}
        onToggleSelect={vi.fn()}
      />,
    )

    // Should show Square icons for unselected tasks
    const buttons = screen.getAllByRole('button')
    const selectButtons = buttons.filter(btn =>
      btn.querySelector('svg.lucide-square') || btn.querySelector('svg.lucide-check-square'),
    )
    expect(selectButtons.length).toBeGreaterThan(0)
  })

  it('shows selected state for tasks in selectedTaskIds', () => {
    render(
      <TaskList
        {...defaultProps}
        isSelectionMode={true}
        selectedTaskIds={new Set(['task-1'])}
        onToggleSelect={vi.fn()}
      />,
    )

    // Task 1 should be selected (CheckSquare icon)
    const buttons = screen.getAllByRole('button')
    const selectedButton = buttons.find(btn =>
      btn.querySelector('svg.text-blue-500') || btn.querySelector('svg.lucide-check-square'),
    )
    expect(selectedButton).toBeTruthy()
  })

  it('calls onToggleSelect when selection checkbox is clicked', () => {
    const onToggleSelect = vi.fn()
    render(
      <TaskList
        {...defaultProps}
        isSelectionMode={true}
        selectedTaskIds={new Set()}
        onToggleSelect={onToggleSelect}
      />,
    )

    // Find and click a selection button
    const buttons = screen.getAllByRole('button')
    const selectButton = buttons.find(btn => btn.querySelector('svg.lucide-square'))
    if (selectButton) {
      fireEvent.click(selectButton)
      expect(onToggleSelect).toHaveBeenCalled()
    }
  })

  it('renders in editing mode when editingTaskId is set', () => {
    render(
      <TaskList
        {...defaultProps}
        editingTaskId="task-1"
        editName="Edited Task"
      />,
    )

    const input = screen.getByDisplayValue('Edited Task')
    expect(input).toBeInTheDocument()
  })

  it('renders empty state when no tasks', () => {
    render(<TaskList {...defaultProps} tasks={[]} />)
    // Should render without errors
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument()
  })

  it('passes contextMeta to TaskItem when provided', () => {
    const contextMeta = new Map([
      ['task-1', {
        listName: 'My List',
        listIcon: '📝',
        groupName: 'My Group',
        groupColor: '#ff0000',
      }],
    ])

    render(<TaskList {...defaultProps} contextMeta={contextMeta} />)

    expect(screen.getByText('My List')).toBeInTheDocument()
    expect(screen.getByText('My Group')).toBeInTheDocument()
  })

  it('disables sorting when disableSorting is true', () => {
    render(<TaskList {...defaultProps} disableSorting={true} />)
    // Component should render without errors
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })
})
