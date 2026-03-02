# MCP (Model Context Protocol) Setup Guide

This guide explains how to connect Claude Desktop or other MCP clients to your PuraToDo account.

## What is MCP?

The Model Context Protocol (MCP) is a standard protocol that allows AI assistants like Claude to interact with external applications. With PuraToDo's MCP integration, you can:

- **View your tasks** - See today's tasks, overdue items, starred tasks, and more
- **Manage tasks** - Create, update, complete, and delete tasks through natural language
- **Search tasks** - Find tasks by name or keyword
- **Get organized** - Use prompts to get summaries and recommendations

## Setup Steps

### Step 1: Generate an API Token

1. Log in to your PuraToDo account
2. Navigate to **Settings** → **API Tokens** (or visit `/dashboard/settings/tokens`)
3. Click **Create Token**
4. Enter a name (e.g., "Claude Desktop")
5. Select the scopes you need:
   - **Read** - View tasks, lists, and groups
   - **Write** - Create, update, and delete tasks
6. (Optional) Set an expiration date
7. Click **Generate Token**
8. **Important:** Copy the token immediately! It will only be shown once.

### Step 2: Configure Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Developer → Edit Config
3. Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "puratodo": {
      "url": "https://your-puratodo-domain.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Replace:
- `your-puratodo-domain.com` with your actual PuraToDo domain
- `YOUR_TOKEN_HERE` with the token you copied in Step 1

4. Save the config file
5. Restart Claude Desktop

### Step 3: Verify Connection

In Claude Desktop, try asking:
- "What tasks do I have today?"
- "Show me my overdue tasks"
- "What's on my task list?"

If the connection is working, Claude will be able to access your PuraToDo data.

## Available Features

### Resources (Read-Only Data)

| Resource | URI | Description |
|----------|-----|-------------|
| Groups | `puratodo://groups` | All task groups (categories) |
| Lists | `puratodo://lists` | All task lists with group info |
| Today's Tasks | `puratodo://tasks/today` | Tasks planned for today |
| Overdue Tasks | `puratodo://tasks/overdue` | Incomplete tasks past due date |
| Starred Tasks | `puratodo://tasks/starred` | All starred tasks |
| Inbox Tasks | `puratodo://tasks/inbox` | Unsorted tasks in inbox |

### Tools (Actions)

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_task` | Create a new task | `list_id` (required), `name` (required), `due_date`, `plan_date`, `comment`, `duration_minutes`, `starred` |
| `update_task` | Update an existing task | `task_id` (required), `name`, `completed`, `starred`, `due_date`, `plan_date`, `comment` |
| `delete_task` | Delete a task permanently | `task_id` (required) |
| `complete_task` | Mark a task as completed | `task_id` (required) |
| `search_tasks` | Search tasks by name | `query` (required), `limit` |

### Prompts (Templates)

| Prompt | Description |
|--------|-------------|
| `today_tasks` | Get a summary of today's tasks with prioritization help |
| `overdue_tasks` | Review overdue tasks with handling suggestions |
| `weekly_review` | Comprehensive weekly review with recommendations |
| `add_task` | Add a new task with list selection guidance |
| `search_and_complete` | Search and complete tasks in one flow |

## Security Best Practices

### Token Security

- **Never share tokens** - Each token is unique to your account
- **Use descriptive names** - Name tokens after the client/device using them
- **Set expiration dates** - Limit token lifetime for sensitive accounts
- **Revoke unused tokens** - Delete tokens you no longer need

### Scope Limitations

- **Read-only tokens** - For clients that only need to view data
- **Read+Write tokens** - For clients that need to modify tasks
- **Principle of least privilege** - Only grant the permissions needed

### Token Storage

Tokens are stored securely in the database:
- Only the **hashed** version is stored (SHA-256)
- The raw token is **never stored** after creation
- Tokens can be **revoked** instantly if compromised

## Troubleshooting

### MCP Not Connecting

**Symptoms:** Claude says it can't connect to PuraToDo

**Solutions:**
1. Verify your token is correct in the config file
2. Check that the URL is correct (include `/api/mcp`)
3. Ensure your token hasn't been revoked
4. Restart Claude Desktop after config changes

### Permission Errors

**Symptoms:** "Unauthorized" or "Access denied" errors

**Solutions:**
1. Verify your token has the required scopes
2. Generate a new token with the correct permissions
3. Check that the token hasn't expired

### Token Not Working

**Symptoms:** Token appears valid but requests fail

**Solutions:**
1. Ensure the token starts with `pt_live_`
2. Check for extra whitespace in the config
3. Verify the Authorization header format: `Bearer pt_live_xxx`
4. Try generating a new token

### Tasks Not Showing

**Symptoms:** Claude can connect but sees no tasks

**Solutions:**
1. Verify you have tasks in your PuraToDo account
2. Check that tasks have the expected dates (plan_date for "today")
3. Try a different resource (e.g., `puratodo://lists`)

## Example Usage

Once configured, you can interact with PuraToDo naturally:

**Viewing Tasks:**
> "What do I have planned for today?"
> "Show me all my overdue tasks"
> "What are my starred items?"

**Managing Tasks:**
> "Add a task to buy groceries tomorrow"
> "Mark the 'Review proposal' task as complete"
> "Delete the old meeting notes task"

**Getting Organized:**
> "Help me prioritize my day"
> "Give me a weekly review"
> "What should I focus on first?"

## API Reference

For programmatic access, the MCP endpoint supports these methods:

### POST /api/mcp

**Headers:**
```
Authorization: Bearer pt_live_xxx
Content-Type: application/json
```

**Request Body:**
```json
{
  "method": "resources/list",
  "params": {}
}
```

**Response:**
```json
{
  "result": {
    "resources": [...]
  }
}
```

### GET /api/mcp

Health check endpoint that returns server info.

**Response:**
```json
{
  "name": "puratodo-mcp",
  "version": "1.0.0",
  "status": "ok",
  "capabilities": {...}
}
```

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/your-repo/puratodo/issues)
2. Review your token settings at `/dashboard/settings/tokens`
3. Try generating a new token and reconfiguring

---

**Note:** MCP integration requires an active PuraToDo account and a valid API token. The integration works with Claude Desktop and other MCP-compatible clients.
