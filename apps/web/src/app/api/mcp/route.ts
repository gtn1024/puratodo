import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { createMCPServer, getServerInfo } from '@/lib/mcp'
import { MCPErrorCodes } from '@/lib/mcp/server'

type JsonRpcId = string | number
type JsonRpcErrorCode = typeof MCPErrorCodes[keyof typeof MCPErrorCodes]

interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, unknown>
  id?: JsonRpcId
}

interface LegacyRequest {
  method: string
  params?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isLegacyRequest(value: unknown): value is LegacyRequest {
  return isRecord(value) && typeof value.method === 'string' && !('jsonrpc' in value)
}

function parseJsonRpcRequest(value: unknown): { request?: JsonRpcRequest, error?: string, id?: JsonRpcId | null } {
  if (!isRecord(value))
    return { error: 'Invalid Request', id: null }

  const jsonrpc = value.jsonrpc
  if (jsonrpc !== '2.0')
    return { error: 'Invalid Request: jsonrpc must be "2.0"', id: null }

  const method = value.method
  if (typeof method !== 'string')
    return { error: 'Invalid Request: method must be a string', id: null }

  const idValue = value.id
  const hasId = 'id' in value
  if (hasId && typeof idValue !== 'string' && typeof idValue !== 'number')
    return { error: 'Invalid Request: id must be a string or number', id: null }

  const paramsValue = value.params
  if ('params' in value && (!isRecord(paramsValue)))
    return { error: 'Invalid params: params must be an object', id: hasId ? (idValue as JsonRpcId) : null }

  return {
    request: {
      jsonrpc: '2.0',
      method,
      params: paramsValue as Record<string, unknown> | undefined,
      id: hasId ? (idValue as JsonRpcId) : undefined,
    },
  }
}

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: '2.0' as const,
    id,
    result,
  }
}

function jsonRpcError(id: JsonRpcId | null, code: JsonRpcErrorCode | number, message: string) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code,
      message,
    },
  }
}

/**
 * MCP API Endpoint
 *
 * This endpoint implements the Model Context Protocol (MCP) for
 * integration with Claude Desktop and other MCP clients.
 *
 * Authentication:
 * - Bearer token (PAT) in Authorization header
 * - Or session cookie (JWT)
 *
 * Supported methods:
 * - resources/list: List available resources
 * - resources/read: Read a specific resource
 * - tools/list: List available tools
 * - tools/call: Execute a tool
 * - prompts/list: List available prompts
 * - prompts/get: Get a specific prompt
 * - initialize: Protocol handshake
 * - ping: Keep-alive
 */

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await getAuthenticatedUser(request)

    if (!authResult) {
      return NextResponse.json(
        jsonRpcError(null, MCPErrorCodes.InvalidRequest, 'Unauthorized'),
        { status: 401 },
      )
    }

    const { userId } = authResult

    // Parse request body
    let body
    try {
      body = await request.json()
    }
    catch {
      return NextResponse.json(
        jsonRpcError(null, MCPErrorCodes.ParseError, 'Parse error: invalid JSON body'),
        { status: 400 },
      )
    }

    // Create MCP server instance and handle request
    const server = createMCPServer({ userId })

    // Backward compatibility for older non-JSON-RPC clients
    if (isLegacyRequest(body)) {
      const response = await server.handleRequest({
        method: body.method,
        params: body.params,
      })
      return NextResponse.json(response)
    }

    const processJsonRpcRequest = async (item: unknown) => {
      const parsed = parseJsonRpcRequest(item)

      if (!parsed.request) {
        return {
          response: jsonRpcError(
            parsed.id ?? null,
            MCPErrorCodes.InvalidRequest,
            parsed.error || 'Invalid Request',
          ),
          isNotification: false,
        }
      }

      const { id, method, params } = parsed.request
      const response = await server.handleRequest({
        method,
        params,
      })

      // Notifications (no id) do not require responses
      if (id === undefined)
        return { isNotification: true as const, response: null }

      if (response.error) {
        return {
          isNotification: false as const,
          response: jsonRpcError(id, response.error.code, response.error.message),
        }
      }

      return {
        isNotification: false as const,
        response: jsonRpcResult(id, response.result ?? {}),
      }
    }

    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json(
          jsonRpcError(null, MCPErrorCodes.InvalidRequest, 'Invalid Request'),
          { status: 400 },
        )
      }

      const responses = []
      for (const item of body) {
        const processed = await processJsonRpcRequest(item)
        if (!processed.isNotification && processed.response)
          responses.push(processed.response)
      }

      if (responses.length === 0)
        return new NextResponse(null, { status: 204 })

      return NextResponse.json(responses)
    }

    const processed = await processJsonRpcRequest(body)
    if (processed.isNotification || !processed.response)
      return new NextResponse(null, { status: 204 })

    return NextResponse.json(processed.response)
  }
  catch (error) {
    console.error('MCP API Error:', error)
    return NextResponse.json(
      jsonRpcError(null, MCPErrorCodes.InternalError, 'Internal server error'),
      { status: 500 },
    )
  }
}

/**
 * Health check endpoint
 *
 * Returns server info and capabilities
 */
export async function GET(request: NextRequest) {
  // Optional: Require authentication for health check
  const authResult = await getAuthenticatedUser(request)

  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  }

  return NextResponse.json(getServerInfo())
}
