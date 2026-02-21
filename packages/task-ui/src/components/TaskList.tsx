"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  pointerWithin,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskItem, type TaskItemProps } from "./TaskItem";
import type { TaskWithSubtasks } from "@puratodo/api-types";

const ROOT_SORTABLE_ID = "root-tasks";
const SUBTASK_SORTABLE_PREFIX = "subtasks-";

function getParentIdFromContainerId(containerId: string): string | null {
  if (containerId === ROOT_SORTABLE_ID) {
    return null;
  }

  if (containerId.startsWith(SUBTASK_SORTABLE_PREFIX)) {
    return containerId.slice(SUBTASK_SORTABLE_PREFIX.length) || null;
  }

  return null;
}

function reorderSiblingTasks(
  taskList: TaskWithSubtasks[],
  parentId: string | null,
  activeId: string,
  overId: string
): { nextTasks: TaskWithSubtasks[]; orderedIds: string[] } {
  if (parentId === null) {
    const oldIndex = taskList.findIndex((task) => task.id === activeId);
    const newIndex = taskList.findIndex((task) => task.id === overId);

    if (oldIndex === -1 || newIndex === -1) {
      return { nextTasks: taskList, orderedIds: [] };
    }

    const nextTasks = arrayMove(taskList, oldIndex, newIndex);
    return { nextTasks, orderedIds: nextTasks.map((task) => task.id) };
  }

  const reorderInNestedTasks = (
    tasks: TaskWithSubtasks[]
  ): { nextTasks: TaskWithSubtasks[]; orderedIds: string[]; changed: boolean } => {
    let orderedIds: string[] = [];
    let changed = false;

    const nextTasks = tasks.map((task) => {
      if (task.id === parentId) {
        const subtasks = task.subtasks || [];
        const oldIndex = subtasks.findIndex((subtask) => subtask.id === activeId);
        const newIndex = subtasks.findIndex((subtask) => subtask.id === overId);

        if (oldIndex === -1 || newIndex === -1) {
          return task;
        }

        const reorderedSubtasks = arrayMove(subtasks, oldIndex, newIndex);
        orderedIds = reorderedSubtasks.map((subtask) => subtask.id);
        changed = true;
        return { ...task, subtasks: reorderedSubtasks };
      }

      if (task.subtasks && task.subtasks.length > 0) {
        const nested = reorderInNestedTasks(task.subtasks);
        if (nested.changed) {
          orderedIds = nested.orderedIds;
          changed = true;
          return { ...task, subtasks: nested.nextTasks };
        }
      }

      return task;
    });

    return { nextTasks, orderedIds, changed };
  };

  const reordered = reorderInNestedTasks(taskList);
  return {
    nextTasks: reordered.changed ? reordered.nextTasks : taskList,
    orderedIds: reordered.orderedIds,
  };
}

export interface TaskListProps {
  tasks: TaskWithSubtasks[];
  expandedTasks: Set<string>;
  onToggleExpand: (taskId: string) => void;
  onToggleComplete: (task: TaskWithSubtasks) => void;
  onToggleStar: (task: TaskWithSubtasks) => void;
  onEdit: (task: TaskWithSubtasks) => void;
  onDelete: (task: TaskWithSubtasks) => void;
  onAddSubtask: (task: TaskWithSubtasks) => void;
  onOpenDetail: (task: TaskWithSubtasks) => void;
  editingTaskId: string | null;
  editName: string;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  canMoveFromInbox?: boolean;
  moveTargets?: TaskItemProps["moveTargets"];
  onMoveToList?: (task: TaskWithSubtasks, targetListId: string) => void;
  disableSorting?: boolean;
  allowSubtaskActions?: boolean;
  contextMeta?: Map<string, TaskItemProps["contextMeta"]>;
  onReorder: (listId: string, orderedIds: string[], parentId?: string) => Promise<void>;
  listId: string;
  // Multi-select props
  isSelectionMode?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelect?: (taskId: string) => void;
}

export function TaskList({
  tasks,
  expandedTasks,
  onToggleExpand,
  onToggleComplete,
  onToggleStar,
  onEdit,
  onDelete,
  onAddSubtask,
  onOpenDetail,
  editingTaskId,
  editName,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  canMoveFromInbox,
  moveTargets,
  onMoveToList,
  disableSorting,
  allowSubtaskActions,
  contextMeta,
  onReorder,
  listId,
  isSelectionMode,
  selectedTaskIds,
  onToggleSelect,
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeContainerId = String(active.data.current?.sortable.containerId || "");
    const overContainerId = String(over.data.current?.sortable.containerId || "");

    if (
      !activeContainerId ||
      !overContainerId ||
      activeContainerId !== overContainerId
    ) {
      return;
    }

    if (
      activeContainerId !== ROOT_SORTABLE_ID &&
      !activeContainerId.startsWith(SUBTASK_SORTABLE_PREFIX)
    ) {
      return;
    }

    const parentId = getParentIdFromContainerId(activeContainerId);
    const activeId = String(active.id);
    const overId = String(over.id);

    const { nextTasks, orderedIds } = reorderSiblingTasks(
      tasks,
      parentId,
      activeId,
      overId
    );

    if (orderedIds.length === 0) {
      return;
    }

    // Call the onReorder callback - the parent is responsible for updating state
    await onReorder(listId, orderedIds, parentId ?? undefined);
  };

  const renderSubtasks = (
    task: TaskWithSubtasks,
    level: number
  ): React.ReactNode => {
    if (!task.subtasks || task.subtasks.length === 0) return null;

    return (
      <SortableContext
        id={`${SUBTASK_SORTABLE_PREFIX}${task.id}`}
        items={task.subtasks.map((subtask) => subtask.id)}
        strategy={verticalListSortingStrategy}
      >
        {task.subtasks.map((subtask) => (
          <TaskItem
            key={subtask.id}
            task={subtask}
            level={level + 1}
            expandedTasks={expandedTasks}
            onToggleExpand={onToggleExpand}
            onToggleComplete={onToggleComplete}
            onToggleStar={onToggleStar}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubtask={onAddSubtask}
            onOpenDetail={onOpenDetail}
            editingTaskId={editingTaskId}
            editName={editName}
            onEditNameChange={onEditNameChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            canMoveFromInbox={false}
            moveTargets={moveTargets}
            onMoveToList={onMoveToList}
            disableSorting={disableSorting}
            allowSubtaskActions={allowSubtaskActions}
            renderSubtasks={renderSubtasks}
            isSelectionMode={isSelectionMode}
            isSelected={selectedTaskIds?.has(subtask.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </SortableContext>
    );
  };

  if (disableSorting) {
    return (
      <ul className="space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            level={0}
            expandedTasks={expandedTasks}
            onToggleExpand={onToggleExpand}
            onToggleComplete={onToggleComplete}
            onToggleStar={onToggleStar}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubtask={onAddSubtask}
            onOpenDetail={onOpenDetail}
            editingTaskId={editingTaskId}
            editName={editName}
            onEditNameChange={onEditNameChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            canMoveFromInbox={canMoveFromInbox}
            moveTargets={moveTargets}
            onMoveToList={onMoveToList}
            disableSorting={disableSorting}
            allowSubtaskActions={allowSubtaskActions}
            contextMeta={contextMeta?.get(task.id)}
            renderSubtasks={renderSubtasks}
            isSelectionMode={isSelectionMode}
            isSelected={selectedTaskIds?.has(task.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </ul>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={({ droppableContainers, ...args }) => {
        // First try pointer within, then fall back to closest center
        const pointerCollisions = pointerWithin({
          droppableContainers,
          ...args,
        });
        if (pointerCollisions.length > 0) {
          return pointerCollisions;
        }
        return closestCenter({
          droppableContainers,
          ...args,
        });
      }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        id={ROOT_SORTABLE_ID}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-1">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              level={0}
              expandedTasks={expandedTasks}
              onToggleExpand={onToggleExpand}
              onToggleComplete={onToggleComplete}
              onToggleStar={onToggleStar}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onOpenDetail={onOpenDetail}
              editingTaskId={editingTaskId}
              editName={editName}
              onEditNameChange={onEditNameChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              canMoveFromInbox={canMoveFromInbox}
              moveTargets={moveTargets}
              onMoveToList={onMoveToList}
              disableSorting={disableSorting}
              allowSubtaskActions={allowSubtaskActions}
              contextMeta={contextMeta?.get(task.id)}
              renderSubtasks={renderSubtasks}
              isSelectionMode={isSelectionMode}
              isSelected={selectedTaskIds?.has(task.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
