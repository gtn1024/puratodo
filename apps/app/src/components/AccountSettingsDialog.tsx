import * as React from "react";
import { AlertCircle, Check, Lock, Mail, Server, Trash2, UserPlus, Users } from "lucide-react";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@puratodo/ui";
import { authApi } from "@/lib/api/auth";
import { ApiException } from "@/lib/api/client";
import { DEFAULT_API_URL, isValidApiUrl, normalizeApiUrl } from "@/lib/api/config";
import { useAuthStore, AccountSession } from "@/stores/authStore";

interface AccountSettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAccountChanged?: () => Promise<void> | void;
  defaultIsAdding?: boolean;
}

export function AccountSettingsDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onAccountChanged,
  defaultIsAdding = false,
}: AccountSettingsDialogProps) {
  const {
    accounts,
    activeAccountId,
    addAccount,
    switchAccount,
    removeAccount,
    setCurrentServerUrl,
  } = useAuthStore();

  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [serverUrl, setServerUrl] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [editingServerUrlAccountId, setEditingServerUrlAccountId] = React.useState<string | null>(null);
  const [editingServerUrlValue, setEditingServerUrlValue] = React.useState("");
  const [deleteAccountId, setDeleteAccountId] = React.useState<string | null>(null);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const sortedAccounts = React.useMemo(
    () =>
      [...accounts].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)),
    [accounts]
  );

  const resetForm = React.useCallback(() => {
    setIsAdding(false);
    setEmail("");
    setPassword("");
    setServerUrl("");
    setIsSubmitting(false);
    setError(null);
    setSuccess(null);
    setEditingServerUrlAccountId(null);
    setEditingServerUrlValue("");
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && defaultIsAdding) {
      setIsAdding(true);
    }
    if (!nextOpen) {
      resetForm();
    }
  };

  // When controlled mode and dialog opens, set isAdding if defaultIsAdding
  React.useEffect(() => {
    if (isControlled && open && defaultIsAdding) {
      setIsAdding(true);
    }
    if (isControlled && !open) {
      resetForm();
    }
  }, [isControlled, open, defaultIsAdding, resetForm]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please provide email and password");
      return;
    }

    // Validate server URL if provided
    const normalizedServerUrl = serverUrl.trim() ? normalizeApiUrl(serverUrl) : "";
    if (normalizedServerUrl && !isValidApiUrl(normalizedServerUrl)) {
      setError("Please enter a valid server URL starting with http:// or https://");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authApi.login({
        email: email.trim(),
        password,
      });

      // Temporarily switch to the new account to set its server URL
      const previousAccountId = activeAccountId;
      addAccount(response.user, response.token, true);

      // Set server URL for the new account
      if (normalizedServerUrl) {
        setCurrentServerUrl(normalizedServerUrl);
      }

      setSuccess("Account added successfully");
      setEmail("");
      setPassword("");
      setServerUrl("");
      setIsAdding(false);

      await onAccountChanged?.();
    } catch (err) {
      const message =
        err instanceof ApiException
          ? err.message
          : "Failed to add account";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    setError(null);
    setSuccess(null);
    switchAccount(accountId);
    await onAccountChanged?.();
    setSuccess("Switched account");
  };

  const handleRemoveAccount = (accountId: string) => {
    setDeleteAccountId(accountId);
  };

  const confirmRemoveAccount = async () => {
    if (!deleteAccountId) return;

    setError(null);
    setSuccess(null);
    removeAccount(deleteAccountId);
    setDeleteAccountId(null);
    await onAccountChanged?.();
    setSuccess("Account removed");
  };

  const cancelRemoveAccount = () => {
    setDeleteAccountId(null);
  };

  const accountToDelete = deleteAccountId
    ? accounts.find((account) => account.id === deleteAccountId)
    : null;

  const startEditServerUrl = (account: AccountSession) => {
    setEditingServerUrlAccountId(account.id);
    setEditingServerUrlValue(account.serverUrl ?? DEFAULT_API_URL);
  };

  const cancelEditServerUrl = () => {
    setEditingServerUrlAccountId(null);
    setEditingServerUrlValue("");
  };

  const saveServerUrl = (account: AccountSession) => {
    const normalizedUrl = normalizeApiUrl(editingServerUrlValue);
    const shouldUseDefault = normalizedUrl.length === 0 || normalizedUrl === DEFAULT_API_URL;

    if (!shouldUseDefault && !isValidApiUrl(normalizedUrl)) {
      setError("Invalid server URL");
      return;
    }

    // Need to temporarily switch to this account to set its server URL
    const wasActive = account.id === activeAccountId;

    if (!wasActive) {
      switchAccount(account.id);
    }

    setCurrentServerUrl(shouldUseDefault ? null : normalizedUrl);

    // Update the local account object for immediate display
    account.serverUrl = shouldUseDefault ? null : normalizedUrl;

    setEditingServerUrlAccountId(null);
    setEditingServerUrlValue("");
    setSuccess("Server URL updated");
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Account Settings</span>
          </DialogTitle>
          <DialogDescription>
            Manage multiple signed-in accounts. Each account has its own API server URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            {sortedAccounts.length === 0 && (
              <p className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
                No accounts saved yet.
              </p>
            )}

            {sortedAccounts.map((account) => {
              const isActive = account.id === activeAccountId;
              const isEditingServer = editingServerUrlAccountId === account.id;

              return (
                <div
                  key={account.id}
                  className="rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {account.user.email}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {isActive ? "Current account" : "Saved account"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchAccount(account.id)}
                        >
                          Switch
                        </Button>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          Active
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-stone-400 hover:text-red-500"
                        onClick={() => handleRemoveAccount(account.id)}
                        disabled={sortedAccounts.length === 1}
                        title={sortedAccounts.length === 1 ? "At least one account is required" : "Remove account"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Server URL display/edit */}
                  <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                      <Server className="h-3 w-3" />
                      <span>Server:</span>
                    </div>
                    {isEditingServer ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="url"
                          value={editingServerUrlValue}
                          onChange={(e) => setEditingServerUrlValue(e.target.value)}
                          placeholder={DEFAULT_API_URL}
                          className="flex-1 px-2 py-1 text-xs border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveServerUrl(account);
                            if (e.key === "Escape") cancelEditServerUrl();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-500"
                          onClick={() => saveServerUrl(account)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-stone-400"
                          onClick={cancelEditServerUrl}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-stone-700 dark:text-stone-300 truncate">
                          {account.serverUrl || DEFAULT_API_URL}
                        </span>
                        <button
                          onClick={() => startEditServerUrl(account)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isAdding && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsAdding(true);
                setError(null);
                setSuccess(null);
              }}
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New Account</span>
            </Button>
          )}

          {isAdding && (
            <form onSubmit={handleAddAccount} className="space-y-3 rounded-lg border border-stone-200 p-3 dark:border-stone-700">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Account email"
                icon={<Mail className="h-4 w-4" />}
                disabled={isSubmitting}
                autoFocus
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                icon={<Lock className="h-4 w-4" />}
                disabled={isSubmitting}
              />
              <Input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder={`API Server URL (default: ${DEFAULT_API_URL})`}
                icon={<Server className="h-4 w-4" />}
                disabled={isSubmitting}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setEmail("");
                    setPassword("");
                    setServerUrl("");
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Sign in and Add"}
                </Button>
              </div>
            </form>
          )}

          {error && (
            <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </p>
          )}

          {success && (
            <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>{success}</span>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete confirmation dialog */}
    <Dialog open={!!deleteAccountId} onOpenChange={(open) => !open && cancelRemoveAccount()}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>Remove Account</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{accountToDelete?.user.email}</strong>? You can add this account again later.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={cancelRemoveAccount}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmRemoveAccount}
          >
            Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default AccountSettingsDialog;
