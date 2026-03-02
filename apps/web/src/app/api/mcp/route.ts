import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { createMCPServer, getServerInfo } from '@/lib/mcp'

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
        { error: 'Unauthorized' },
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
        { error: 'Invalid JSON body' },
        { status: 400 },
      )
    }

    // Validate request structure
    if (!body.method || typeof body.method !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid method' },
        { status: 400 },
      )
    }

    // Create MCP server instance and handle request
    const server = createMCPServer({ userId })
    const response = await server.handleRequest({
      method: body.method,
      params: body.params,
    })

    return NextResponse.json(response)
  }
  catch (error) {
    console.error('MCP API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
