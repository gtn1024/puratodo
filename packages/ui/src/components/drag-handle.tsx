import { GripVertical } from "lucide-react";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

interface DragHandleProps {
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap | undefined;
  className?: string;
  iconSize?: "sm" | "md";
}

export function DragHandle({
  attributes,
  listeners,
  className = "",
  iconSize = "md",
}: DragHandleProps) {
  const sizeClasses = iconSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}
    >
      <GripVertical className={sizeClasses} />
    </button>
  );
}
