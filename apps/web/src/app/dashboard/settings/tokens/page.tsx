import type { Metadata } from 'next'
import { listApiTokens } from '@/actions/api-tokens'
import { TokenList } from './token-list'

export const metadata: Metadata = {
  title: 'API Tokens - PuraToDo',
  description: 'Manage your API tokens for MCP integration',
}

export default async function TokensSettingsPage() {
  const tokens = await listApiTokens()

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">API Tokens</h1>
        <p className="text-muted-foreground mt-1">
          Manage API tokens for integrating with Claude Desktop and other MCP clients.
        </p>
      </div>
      <TokenList initialTokens={tokens} />
    </div>
  )
}
