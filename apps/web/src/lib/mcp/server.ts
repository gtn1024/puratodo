import type {
  MCPPrompt,
  MCPResource,
  MCPTool,
  PromptGetResult,
  ResourceReadResult,
  ToolExecutionResult,
} from './types'
import { getPrompt, listPrompts } from './prompts'
import { listResources, readResource } from './resources'
import { executeTool, listTools } from './tools'

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  userId: string
}

/**
 * MCP Request structure
 */
export interface MCPRequest {
  method: string
  params?: Record<string, unknown>
}

/**
 * MCP Response structure
 */
export interface MCPResponse {
  result?: unknown
  error?: {
    code: number
    message: string
  }
}

/**
 * MCP Error codes (JSON-RPC 2.0)
 */
export const MCPErrorCodes = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const

/**
 * Create an MCP Server instance for a specific user
 *
 * This is a stateless server that handles MCP protocol requests
 * and routes them to the appropriate resource/tool/prompt handlers.
 */
export function createMCPServer(config: MCPServerConfig) {
  const { userId } = config

  /**
   * Handle an MCP protocol request
   */
  async function handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const { method, params = {} } = request

      switch (method) {
        // Resources
        case 'resources/list':
          return {
            result: {
              resources: listResources(),
            },
          }

        case 'resources/read': {
          const uri = params.uri as string
          if (!uri) {
            return {
              error: {
                code: MCPErrorCodes.InvalidParams,
                message: 'Missing required parameter: uri',
              },
            }
          }

          try {
            const data = await readResource(uri, userId)
            const resource = listResources().find(r => r.uri === uri)

            return {
              result: {
                contents: [
                  {
                    uri,
                    mimeType: resource?.mimeType || 'application/json',
                    text: JSON.stringify(data, null, 2),
                  },
                ],
              } as ResourceReadResult,
            }
          }
          catch (error) {
            return {
              error: {
                code: MCPErrorCodes.InternalError,
                message: error instanceof Error ? error.message : 'Failed to read resource',
              },
            }
          }
        }

        // Tools
        case 'tools/list':
          return {
            result: {
              tools: listTools(),
            },
          }

        case 'tools/call': {
          const toolName = params.name as string
          const toolArgs = (params.arguments as Record<string, unknown>) || {}

          if (!toolName) {
            return {
              error: {
                code: MCPErrorCodes.InvalidParams,
                message: 'Missing required parameter: name',
              },
            }
          }

          const result = await executeTool(toolName, toolArgs, userId)
          return { result }
        }

        // Prompts
        case 'prompts/list':
          return {
            result: {
              prompts: listPrompts(),
            },
          }

        case 'prompts/get': {
          const promptName = params.name as string
          const promptArgs = (params.arguments as Record<string, string>) || {}

          if (!promptName) {
            return {
              error: {
                code: MCPErrorCodes.InvalidParams,
                message: 'Missing required parameter: name',
              },
            }
          }

          try {
            const result = getPrompt(promptName, promptArgs)
            return { result }
          }
          catch (error) {
            return {
              error: {
                code: MCPErrorCodes.InternalError,
                message: error instanceof Error ? error.message : 'Failed to get prompt',
              },
            }
          }
        }

        // Initialize (for protocol handshake)
        case 'initialize':
          return {
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                resources: {},
                tools: {},
                prompts: {},
              },
              serverInfo: {
                name: 'puratodo-mcp',
                version: '1.0.0',
              },
            },
          }

        // Ping (for keep-alive)
        case 'ping':
          return { result: {} }

        default:
          return {
            error: {
              code: MCPErrorCodes.MethodNotFound,
              message: `Unknown method: ${method}`,
            },
          }
      }
    }
    catch (error) {
      return {
        error: {
          code: MCPErrorCodes.InternalError,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      }
    }
  }

  return {
    handleRequest,
    userId,
  }
}

/**
 * Server info for health check endpoint
 */
export function getServerInfo() {
  return {
    name: 'puratodo-mcp',
    version: '1.0.0',
    status: 'ok',
    capabilities: {
      resources: ['groups', 'lists', 'tasks/today', 'tasks/overdue', 'tasks/starred', 'tasks/inbox'],
      tools: ['list_tasks', 'create_task', 'update_task', 'delete_task', 'complete_task', 'search_tasks'],
      prompts: ['today_tasks', 'overdue_tasks', 'weekly_review', 'add_task', 'search_and_complete'],
    },
  }
}

// Re-export types for convenience
export type {
  MCPPrompt,
  MCPResource,
  MCPTool,
  PromptGetResult,
  ResourceReadResult,
  ToolExecutionResult,
}
