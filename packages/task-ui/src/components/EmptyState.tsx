import * as React from "react";
import { Button } from "@puratodo/ui";
import { LucideIcon } from "lucide-react";

/**
 * EmptyState Component
 *
 * Displays a centered empty state with icon, title, description, and optional action button.
 * Used when there's no data to display (e.g., no tasks, no lists, filtered results empty).
 */

export interface EmptyStateProps {
  /**
   * Icon to display in the empty state
   */
  icon: LucideIcon;

  /**
   * Title text for the empty state
   */
  title: string;

  /**
   * Optional description text
   */
  description?: string;

  /**
   * Optional action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`py-12 text-center ${className}`}>
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
        <Icon className="h-6 w-6 text-stone-400" />
      </div>
      <p className="text-stone-500 dark:text-stone-400 mb-4">{title}</p>
      {description && (
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.icon && <action.icon className="h-4 w-4 mr-1" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
