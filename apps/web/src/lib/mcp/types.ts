/**
 * MCP Types for PuraToDo Integration
 *
 * These types define the structure of MCP resources, tools, and prompts
 * that the PuraToDo MCP server exposes to clients like Claude Desktop.
 */

/**
 * MCP Resource definition
 */
export interface MCPResource {
  uri: string
  name: string
  description: string
  mimeType?: string
}

/**
 * MCP Tool input schema (JSON Schema subset)
 */
export interface MCPToolInputSchema {
  type: 'object'
  properties: Record<string, {
    type: string
    description?: string
    enum?: string[]
  }>
  required?: string[]
}

/**
 * MCP Tool definition
 */
export interface MCPTool {
  name: string
  description: string
  inputSchema: MCPToolInputSchema
}

/**
 * MCPPrompt argument definition
 */
export interface MCPPromptArgument {
  name: string
  description?: string
  required?: boolean
}

/**
 * MCPPrompt definition
 */
export interface MCPPrompt {
  name: string
  description: string
  arguments?: MCPPromptArgument[]
}

/**
 * Resource read result
 */
export interface ResourceReadResult {
  contents: Array<{
    uri: string
    mimeType?: string
    text: string
  }>
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError?: boolean
}

/**
 * Prompt get result
 */
export interface PromptGetResult {
  description?: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: {
      type: 'text'
      text: string
    }
  }>
}
