import * as React from "react";
import { AlertCircle, Check, Lock, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authApi } from "@/lib/api/auth";
import { ApiException } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

interface AccountSettingsDialogProps {
  trigger: React.ReactNode;
  onAccountChanged?: () => Promise<void> | void;
}

export function AccountSettingsDialog({
  trigger,
  onAccountChanged,
}: AccountSettingsDialogProps) {
  const {
    accounts,
    activeAccountId,
    addAccount,
    switchAccount,
    removeAccount,
  } = useAuthStore();

  const [open, setOpen] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const sortedAccounts = React.useMemo(
    () =>
      [...accounts].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)),
    [accounts]
  );

  const resetForm = React.useCallback(() => {
    setIsAdding(false);
    setEmail("");
    setPassword("");
    setIsSubmitting(false);
    setError(null);
    setSuccess(null);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please provide email and password");
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

      addAccount(response.user, response.token, false);
      setSuccess("Account added successfully");
      setEmail("");
      setPassword("");
      setIsAdding(false);
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

  const handleRemoveAccount = async (accountId: string) => {
    const target = accounts.find((account) => account.id === accountId);
    if (!target) return;

    const confirmed = confirm(`Remove account ${target.user.email}?`);
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    removeAccount(accountId);
    await onAccountChanged?.();
    setSuccess("Account removed");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Account Settings</span>
          </DialogTitle>
          <DialogDescription>
            Manage multiple signed-in accounts for this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            {sortedAccounts.length === 0 && (
              <p className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                No accounts saved yet.
              </p>
            )}

            {sortedAccounts.map((account) => {
              const isActive = account.id === activeAccountId;
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {account.user.email}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                      className="text-zinc-400 hover:text-red-500"
                      onClick={() => handleRemoveAccount(account.id)}
                      disabled={sortedAccounts.length === 1}
                      title={sortedAccounts.length === 1 ? "At least one account is required" : "Remove account"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <form onSubmit={handleAddAccount} className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
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

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setEmail("");
                    setPassword("");
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
  );
}

export default AccountSettingsDialog;
