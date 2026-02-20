-- Test data for E2E testing (non-auth tables only)
-- Auth users should be created via Supabase CLI or admin API

-- Create a default group for test user (id: 00000000-0000-0000-0000-000000000001)
INSERT INTO public.groups (id, user_id, name, color, sort_order)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Inbox',
  '#6366f1',
  0
) ON CONFLICT DO NOTHING;

-- Create a default list for the test user
INSERT INTO public.lists (id, user_id, group_id, name, icon, sort_order)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Tasks',
  'check',
  0
) ON CONFLICT DO NOTHING;

-- Create some sample tasks
INSERT INTO public.tasks (id, user_id, list_id, name, completed, sort_order)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'Welcome to PuraToDo!',
  false,
  0
) ON CONFLICT DO NOTHING;
