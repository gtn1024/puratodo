'use client'

import type { ApiToken } from '@puratodo/api-types'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { deleteApiToken, revokeApiToken } from '@/actions/api-tokens'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CreateTokenDialog } from './create-token-dialog'

interface TokenListProps {
  initialTokens: ApiToken[]
}

export function TokenList({ initialTokens }: TokenListProps) {
  const [tokens, setTokens] = useState<ApiToken[]>(initialTokens)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleRevoke = async () => {
    if (!selectedToken)
      return

    setIsSubmitting(true)
    const result = await revokeApiToken(selectedToken.id)
    setIsSubmitting(false)

    if (result.success) {
      setTokens(tokens.filter(t => t.id !== selectedToken.id))
      setRevokeDialogOpen(false)
      setSelectedToken(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedToken)
      return

    setIsSubmitting(true)
    const result = await deleteApiToken(selectedToken.id)
    setIsSubmitting(false)

    if (result.success) {
      setTokens(tokens.filter(t => t.id !== selectedToken.id))
      setDeleteDialogOpen(false)
      setSelectedToken(null)
    }
  }

  const handleTokenCreated = (token: Omit<ApiToken, 'token_hash'>) => {
    setTokens([token as ApiToken, ...tokens])
    setCreateDialogOpen(false)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr)
      return 'Never'
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Tokens</CardTitle>
            <CardDescription>
              Tokens you've created for API access. Keep them secure!
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            Create Token
          </Button>
        </CardHeader>
        <CardContent>
          {tokens.length === 0
            ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No API tokens yet. Create one to get started.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Create Your First Token
                  </Button>
                </div>
              )
            : (
                <div className="space-y-4">
                  {tokens.map(token => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{token.name}</h3>
                          <div className="flex gap-1">
                            {token.scopes.map(scope => (
                              <span
                                key={scope}
                                className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                              >
                                {scope}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <code className="bg-muted px-1 rounded">
                            {token.prefix}
                            ...
                          </code>
                          <span className="mx-2">•</span>
                          <span>
                            Created
                            {formatDate(token.created_at)}
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            Last used
                            {formatDate(token.last_used_at)}
                          </span>
                          {token.expires_at && (
                            <>
                              <span className="mx-2">•</span>
                              <span>
                                Expires
                                {formatDate(token.expires_at)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedToken(token)
                            setRevokeDialogOpen(true)
                          }}
                        >
                          Revoke
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedToken(token)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </CardContent>
      </Card>

      {/* Create Token Dialog */}
      <CreateTokenDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTokenCreated={handleTokenCreated}
      />

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke "
              {selectedToken?.name}
              "?
              This action cannot be undone. The token will immediately stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Revoking...' : 'Revoke Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "
              {selectedToken?.name}
              "?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
