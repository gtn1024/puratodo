"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

interface SortableItemProps {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  renderDragHandle?: (props: {
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
  }) => React.ReactNode;
}

export function SortableItem({
  id,
  disabled = false,
  children,
  className = "",
  renderDragHandle,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? "z-50" : ""}`}
    >
      {renderDragHandle && renderDragHandle({ attributes, listeners })}
      {children}
    </div>
  );
}
