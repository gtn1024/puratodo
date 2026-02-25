-- Add URL field to tasks table
-- Migration: 20260226000000_add_url_to_tasks.sql

-- Add url column to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS url TEXT DEFAULT NULL;

-- Create index for URL searches (optional, for future features)
CREATE INDEX IF NOT EXISTS idx_tasks_url ON public.tasks(url) WHERE url IS NOT NULL;

-- Migrate existing URLs from comment field to url field
-- This extracts the first URL found in comments and moves it to the url column
-- Only updates tasks where url is NULL and comment contains a URL

UPDATE public.tasks
SET
  url = substring(comment from '(https?://[^\s<>"{}|\\^`\[\]]+)'),
  comment = CASE
    -- If comment is just the URL, set it to NULL
    WHEN comment ~ '^\s*https?://[^\s<>"{}|\\^`\[\]]+\s*$' THEN NULL
    -- Otherwise, remove the URL from the comment
    ELSE regexp_replace(comment, 'https?://[^\s<>"{}|\\^`\[\]]+', '')
  END
WHERE url IS NULL
  AND comment IS NOT NULL
  AND comment ~ 'https?://[^\s<>"{}|\\^`\[\]]+';
