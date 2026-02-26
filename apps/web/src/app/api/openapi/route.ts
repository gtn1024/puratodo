import { NextResponse } from 'next/server'

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'PuraToDo API',
    version: '1.0.0',
    description: 'A modern todo application API with support for groups, lists, and nested tasks',
    contact: {
      name: 'PuraToDo',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Server',
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/v1/auth/login',
      },
    },
    schemas: {
      Group: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          color: { type: 'string', nullable: true },
          sort_order: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      List: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          group_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          icon: { type: 'string', nullable: true },
          sort_order: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          list_id: { type: 'string', format: 'uuid' },
          parent_id: { type: 'string', format: 'uuid', nullable: true },
          name: { type: 'string' },
          completed: { type: 'boolean' },
          starred: { type: 'boolean' },
          due_date: { type: 'string', format: 'date', nullable: true },
          plan_date: { type: 'string', format: 'date', nullable: true },
          comment: { type: 'string', nullable: true },
          duration_minutes: { type: 'integer', nullable: true },
          recurrence_frequency: {
            type: 'string',
            nullable: true,
            enum: ['daily', 'weekly', 'monthly', 'custom'],
          },
          recurrence_interval: { type: 'integer', nullable: true, minimum: 1 },
          recurrence_weekdays: {
            type: 'array',
            nullable: true,
            items: { type: 'integer', minimum: 0, maximum: 6 },
          },
          recurrence_end_date: {
            type: 'string',
            format: 'date',
            nullable: true,
          },
          recurrence_end_count: { type: 'integer', nullable: true, minimum: 1 },
          recurrence_rule: { type: 'string', nullable: true },
          recurrence_timezone: { type: 'string', nullable: true },
          recurrence_source_task_id: {
            type: 'string',
            format: 'uuid',
            nullable: true,
          },
          remind_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'When to send a reminder notification',
          },
          reminder_sent_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'When the reminder was sent',
          },
          sort_order: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          subtasks: {
            type: 'array',
            items: { $ref: '#/components/schemas/Task' },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          expires_at: { type: 'integer' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      ApiSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [true] },
          data: { type: 'object' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: { type: 'string' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total_pages: { type: 'integer' },
        },
      },
      ParsedTask: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Clean task name' },
          due_date: { type: 'string', format: 'date', nullable: true },
          plan_date: { type: 'string', format: 'date', nullable: true },
          duration_minutes: { type: 'integer', nullable: true },
          starred: { type: 'boolean' },
          subtasks: {
            type: 'array',
            items: { type: 'string' },
          },
          confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
          detectedHints: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Login to get access token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse',
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Registration successful',
          },
          400: {
            description: 'Email already exists',
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: {
                  refresh_token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token refreshed',
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout and invalidate session',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refresh_token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Logout successful',
          },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user info',
        responses: {
          200: {
            description: 'User info',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/groups': {
      get: {
        summary: 'Get all groups',
        responses: {
          200: {
            description: 'List of groups',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Group' },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new group',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Group created',
          },
        },
      },
    },
    '/groups/{id}': {
      get: {
        summary: 'Get a group by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Group details',
          },
          404: {
            description: 'Group not found',
          },
        },
      },
      patch: {
        summary: 'Update a group',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Group updated',
          },
        },
      },
      delete: {
        summary: 'Delete a group',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Group deleted',
          },
        },
      },
    },
    '/groups/reorder': {
      patch: {
        summary: 'Reorder groups',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['groupIds'],
                properties: {
                  groupIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Groups reordered',
          },
        },
      },
    },
    '/lists': {
      get: {
        summary: 'Get all lists',
        parameters: [
          {
            name: 'group_id',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
            description: 'Filter by group ID',
          },
        ],
        responses: {
          200: {
            description: 'List of lists',
          },
        },
      },
      post: {
        summary: 'Create a new list',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'group_id'],
                properties: {
                  name: { type: 'string' },
                  icon: { type: 'string' },
                  group_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'List created',
          },
        },
      },
    },
    '/lists/{id}': {
      get: {
        summary: 'Get a list by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'List details',
          },
        },
      },
      patch: {
        summary: 'Update a list',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  icon: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'List updated',
          },
        },
      },
      delete: {
        summary: 'Delete a list',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'List deleted',
          },
        },
      },
    },
    '/lists/{id}/move': {
      patch: {
        summary: 'Move a list to another group',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['group_id'],
                properties: {
                  group_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'List moved',
          },
        },
      },
    },
    '/lists/reorder': {
      patch: {
        summary: 'Reorder lists within a group',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['listIds', 'group_id'],
                properties: {
                  listIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                  },
                  group_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Lists reordered',
          },
        },
      },
    },
    '/tasks': {
      get: {
        summary: 'Get all tasks with optional filters',
        parameters: [
          {
            name: 'list_id',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'completed',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'starred',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'parent_id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by parent task ID, use \'null\' for top-level tasks',
          },
        ],
        responses: {
          200: {
            description: 'List of tasks',
          },
        },
      },
      post: {
        summary: 'Create a new task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'list_id'],
                properties: {
                  name: { type: 'string' },
                  list_id: { type: 'string', format: 'uuid' },
                  parent_id: { type: 'string', format: 'uuid' },
                  completed: { type: 'boolean' },
                  starred: { type: 'boolean' },
                  due_date: { type: 'string', format: 'date' },
                  plan_date: { type: 'string', format: 'date' },
                  comment: { type: 'string' },
                  duration_minutes: { type: 'integer' },
                  recurrence_frequency: {
                    type: 'string',
                    enum: ['daily', 'weekly', 'monthly', 'custom'],
                  },
                  recurrence_interval: { type: 'integer', minimum: 1 },
                  recurrence_weekdays: {
                    type: 'array',
                    items: { type: 'integer', minimum: 0, maximum: 6 },
                  },
                  recurrence_end_date: { type: 'string', format: 'date' },
                  recurrence_end_count: { type: 'integer', minimum: 1 },
                  recurrence_rule: { type: 'string' },
                  recurrence_timezone: { type: 'string' },
                  recurrence_source_task_id: {
                    type: 'string',
                    format: 'uuid',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Task created',
          },
        },
      },
    },
    '/tasks/inbox': {
      get: {
        summary: 'Get inbox tasks with optional filters',
        parameters: [
          {
            name: 'completed',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'starred',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'parent_id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by parent task ID, use \'null\' for top-level tasks',
          },
        ],
        responses: {
          200: {
            description: 'Inbox task list',
          },
        },
      },
      post: {
        summary: 'Create a new inbox task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  parent_id: { type: 'string', format: 'uuid' },
                  completed: { type: 'boolean' },
                  starred: { type: 'boolean' },
                  due_date: { type: 'string', format: 'date' },
                  plan_date: { type: 'string', format: 'date' },
                  comment: { type: 'string' },
                  duration_minutes: { type: 'integer' },
                  recurrence_frequency: {
                    type: 'string',
                    enum: ['daily', 'weekly', 'monthly', 'custom'],
                  },
                  recurrence_interval: { type: 'integer', minimum: 1 },
                  recurrence_weekdays: {
                    type: 'array',
                    items: { type: 'integer', minimum: 0, maximum: 6 },
                  },
                  recurrence_end_date: { type: 'string', format: 'date' },
                  recurrence_end_count: { type: 'integer', minimum: 1 },
                  recurrence_rule: { type: 'string' },
                  recurrence_timezone: { type: 'string' },
                  recurrence_source_task_id: {
                    type: 'string',
                    format: 'uuid',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Inbox task created',
          },
        },
      },
    },
    '/tasks/inbox/{id}': {
      get: {
        summary: 'Get an inbox task by ID with subtasks',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Inbox task details',
          },
          404: {
            description: 'Inbox task not found',
          },
        },
      },
      patch: {
        summary: 'Update an inbox task',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  completed: { type: 'boolean' },
                  starred: { type: 'boolean' },
                  due_date: { type: 'string', format: 'date', nullable: true },
                  plan_date: { type: 'string', format: 'date', nullable: true },
                  comment: { type: 'string', nullable: true },
                  duration_minutes: { type: 'integer', nullable: true },
                  recurrence_frequency: {
                    type: 'string',
                    nullable: true,
                    enum: ['daily', 'weekly', 'monthly', 'custom'],
                  },
                  recurrence_interval: {
                    type: 'integer',
                    nullable: true,
                    minimum: 1,
                  },
                  recurrence_weekdays: {
                    type: 'array',
                    nullable: true,
                    items: { type: 'integer', minimum: 0, maximum: 6 },
                  },
                  recurrence_end_date: {
                    type: 'string',
                    format: 'date',
                    nullable: true,
                  },
                  recurrence_end_count: {
                    type: 'integer',
                    nullable: true,
                    minimum: 1,
                  },
                  recurrence_rule: { type: 'string', nullable: true },
                  recurrence_timezone: { type: 'string', nullable: true },
                  recurrence_source_task_id: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                  },
                  recurrence_update_scope: {
                    type: 'string',
                    enum: ['single', 'future'],
                    description:
                      'When updating recurrence fields, apply only this task or this and future occurrences',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Inbox task updated',
          },
          404: {
            description: 'Inbox task not found',
          },
        },
      },
      delete: {
        summary: 'Delete an inbox task',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Inbox task deleted',
          },
          404: {
            description: 'Inbox task not found',
          },
        },
      },
    },
    '/tasks/{id}': {
      get: {
        summary: 'Get a task by ID with subtasks',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Task details with recursive subtasks',
          },
        },
      },
      patch: {
        summary: 'Update a task',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  completed: { type: 'boolean' },
                  starred: { type: 'boolean' },
                  due_date: { type: 'string', format: 'date', nullable: true },
                  plan_date: { type: 'string', format: 'date', nullable: true },
                  comment: { type: 'string', nullable: true },
                  duration_minutes: { type: 'integer', nullable: true },
                  recurrence_frequency: {
                    type: 'string',
                    nullable: true,
                    enum: ['daily', 'weekly', 'monthly', 'custom'],
                  },
                  recurrence_interval: {
                    type: 'integer',
                    nullable: true,
                    minimum: 1,
                  },
                  recurrence_weekdays: {
                    type: 'array',
                    nullable: true,
                    items: { type: 'integer', minimum: 0, maximum: 6 },
                  },
                  recurrence_end_date: {
                    type: 'string',
                    format: 'date',
                    nullable: true,
                  },
                  recurrence_end_count: {
                    type: 'integer',
                    nullable: true,
                    minimum: 1,
                  },
                  recurrence_rule: { type: 'string', nullable: true },
                  recurrence_timezone: { type: 'string', nullable: true },
                  recurrence_source_task_id: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                  },
                  recurrence_update_scope: {
                    type: 'string',
                    enum: ['single', 'future'],
                    description:
                      'When updating recurrence fields, apply only this task or this and future occurrences',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Task updated',
          },
        },
      },
      delete: {
        summary: 'Delete a task',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Task deleted',
          },
        },
      },
    },
    '/tasks/reorder': {
      patch: {
        summary: 'Reorder tasks within a list',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['taskIds', 'list_id'],
                properties: {
                  taskIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                  },
                  list_id: { type: 'string', format: 'uuid' },
                  parent_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Tasks reordered',
          },
        },
      },
    },
    '/tasks/today': {
      get: {
        summary: 'Get tasks with plan_date = today',
        responses: {
          200: {
            description: 'Today\'s tasks with list/group info',
          },
        },
      },
    },
    '/tasks/starred': {
      get: {
        summary: 'Get all starred tasks',
        responses: {
          200: {
            description: 'Starred tasks',
          },
        },
      },
    },
    '/search/tasks': {
      get: {
        summary: 'Search tasks by name',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Search query',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
            description: 'Page number (default: 1)',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
            description: 'Items per page (default: 50, max: 100)',
          },
        ],
        responses: {
          200: {
            description: 'Search results with pagination',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaginatedResponse',
                },
              },
            },
          },
        },
      },
    },
    '/parse-task': {
      post: {
        summary: 'Parse natural language task input',
        description: 'Parse free-text task input and extract structured fields like dates, duration, priority, and subtasks.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['input'],
                properties: {
                  input: {
                    type: 'string',
                    description: 'Free-text task input to parse (e.g., "Meeting tomorrow 2h !")',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Parsed task data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/ParsedTask' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid input',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
  },
}

export async function GET() {
  return NextResponse.json(openApiSpec)
}
