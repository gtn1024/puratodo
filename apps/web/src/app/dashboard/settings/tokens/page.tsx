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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">API Tokens</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">
          Manage API tokens for integrating with Claude Desktop and other MCP clients.
        </p>
      </div>
      <TokenList initialTokens={tokens} />
    </div>
  )
}
