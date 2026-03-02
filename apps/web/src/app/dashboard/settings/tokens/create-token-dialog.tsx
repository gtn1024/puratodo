'use client'

import type { ApiToken } from '@puratodo/api-types'
import { useState } from 'react'
import { createApiToken } from '@/actions/api-tokens'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreateTokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTokenCreated: (token: Omit<ApiToken, 'token_hash'>) => void
}

export function CreateTokenDialog({
  open,
  onOpenChange,
  onTokenCreated,
}: CreateTokenDialogProps) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['read', 'write'])
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleScopeChange = (scope: string, checked: boolean) => {
    if (checked) {
      setScopes([...scopes, scope])
    }
    else {
      setScopes(scopes.filter(s => s !== scope))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Token name is required')
      return
    }

    if (scopes.length === 0) {
      setError('At least one scope is required')
      return
    }

    setIsSubmitting(true)
    const result = await createApiToken(name.trim(), scopes, expiresInDays)
    setIsSubmitting(false)

    if (result.success && result.token) {
      setCreatedToken(result.token.raw_token || null)
      onTokenCreated(result.token)
    }
    else {
      setError(result.error || 'Failed to create token')
    }
  }

  const handleCopy = async () => {
    if (!createdToken)
      return

    try {
      await navigator.clipboard.writeText(createdToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    catch {
      console.error('Failed to copy token')
    }
  }

  const handleClose = () => {
    setName('')
    setScopes(['read', 'write'])
    setExpiresInDays(undefined)
    setError(null)
    setCreatedToken(null)
    setCopied(false)
    onOpenChange(false)
  }

  const mcpConfig = createdToken
    ? JSON.stringify(
        {
          mcpServers: {
            puratodo: {
              url: `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/mcp`,
              headers: {
                Authorization: `Bearer ${createdToken}`,
              },
            },
          },
        },
        null,
        2,
      )
    : ''

  return (
    <Dialog open={open} onOpenChange={createdToken ? handleClose : onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {createdToken ? 'Token Created!' : 'Create API Token'}
          </DialogTitle>
          <DialogDescription>
            {createdToken
              ? 'Copy your token now. You won\'t be able to see it again!'
              : 'Create a new API token for MCP integration with Claude Desktop or other clients.'}
          </DialogDescription>
        </DialogHeader>

        {createdToken
          ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono break-all">{createdToken}</code>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="ml-2 shrink-0">
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ Copy this token now! It will not be shown again.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Claude Desktop Configuration</Label>
                  <p className="text-sm text-muted-foreground">
                    Add this to your Claude Desktop config file:
                  </p>
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                      {mcpConfig}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        navigator.clipboard.writeText(mcpConfig)
                      }}
                    >
                      Copy Config
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Config file location:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    <li>macOS: ~/Library/Application Support/Claude/claude_desktop_config.json</li>
                    <li>Windows: %APPDATA%\Claude\claude_desktop_config.json</li>
                    <li>Linux: ~/.config/Claude/claude_desktop_config.json</li>
                  </ul>
                </div>
              </div>
            )
          : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Token Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Claude Desktop"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scopes</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scope-read"
                        checked={scopes.includes('read')}
                        onCheckedChange={checked => handleScopeChange('read', checked as boolean)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="scope-read" className="font-normal">
                        Read - View tasks, lists, groups
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scope-write"
                        checked={scopes.includes('write')}
                        onCheckedChange={checked => handleScopeChange('write', checked as boolean)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="scope-write" className="font-normal">
                        Write - Create, update, delete
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Expiration (optional)</Label>
                  <select
                    id="expires"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={expiresInDays || ''}
                    onChange={e => setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={isSubmitting}
                  >
                    <option value="">Never expires</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Generate Token'}
                  </Button>
                </DialogFooter>
              </form>
            )}

        {createdToken && (
          <DialogFooter>
            <Button onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
