/**
 * MCP (Model Context Protocol) Integration
 *
 * This module provides MCP server capabilities for PuraToDo,
 * allowing integration with Claude Desktop and other MCP clients.
 */

export { getPrompt, listPrompts, prompts } from './prompts'
export { listResources, readResource, resources } from './resources'
export { createMCPServer, getServerInfo } from './server'
export { executeTool, listTools, tools } from './tools'
export * from './types'
