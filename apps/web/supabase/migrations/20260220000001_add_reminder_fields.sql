-- Add reminder fields to tasks table
-- Migration: 20260220000001_add_reminder_fields.sql

-- Add reminder columns
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient reminder queries (tasks that need reminders)
CREATE INDEX IF NOT EXISTS idx_tasks_remind_at_pending
  ON public.tasks(user_id, remind_at)
  WHERE remind_at IS NOT NULL AND reminder_sent_at IS NULL;

-- Add index for completed tasks with reminders (for cleanup)
CREATE INDEX IF NOT EXISTS idx_tasks_remind_at_completed
  ON public.tasks(user_id, remind_at)
  WHERE remind_at IS NOT NULL AND completed = TRUE;
