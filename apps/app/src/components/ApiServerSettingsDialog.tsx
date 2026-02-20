import * as React from "react";
import { Server } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@puratodo/ui";
import {
  DEFAULT_API_URL,
  isValidApiUrl,
  normalizeApiUrl,
  getPendingApiUrl,
  setPendingApiUrl,
} from "@/lib/api/config";
import { useAuthStore } from "@/stores/authStore";

interface ApiServerSettingsDialogProps {
  trigger: React.ReactNode;
  onSaved?: () => Promise<void> | void;
}

export function ApiServerSettingsDialog({ trigger, onSaved }: ApiServerSettingsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [apiUrlInput, setApiUrlInput] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const { isAuthenticated, getCurrentServerUrl, setCurrentServerUrl } = useAuthStore();

  const resetForm = React.useCallback(() => {
    // If logged in, show current account's server URL
    // If not logged in, show pending URL (for login page)
    if (isAuthenticated) {
      const currentServerUrl = getCurrentServerUrl();
      setApiUrlInput(currentServerUrl ?? DEFAULT_API_URL);
    } else {
      const pendingUrl = getPendingApiUrl();
      setApiUrlInput(pendingUrl ?? DEFAULT_API_URL);
    }
    setError(null);
    setSuccess(null);
  }, [isAuthenticated, getCurrentServerUrl]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetForm();
    }
    setOpen(nextOpen);
  };

  const handleSave = async () => {
    const normalizedApiUrl = normalizeApiUrl(apiUrlInput);
    const shouldUseDefault = normalizedApiUrl.length === 0 || normalizedApiUrl === DEFAULT_API_URL;

    if (!shouldUseDefault && !isValidApiUrl(normalizedApiUrl)) {
      setError("Please enter a valid URL starting with http:// or https://");
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const urlToSave = shouldUseDefault ? null : normalizedApiUrl;

      if (isAuthenticated) {
        // Save to current account
        setCurrentServerUrl(urlToSave);
      } else {
        // Save as pending URL for login
        setPendingApiUrl(urlToSave);
      }

      await onSaved?.();

      setSuccess(shouldUseDefault ? "Saved. Using default API server." : "Saved. Using custom API server.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save API server";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <span>API Server</span>
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? `Set the API server URL for the current account. Default: ${DEFAULT_API_URL}`
              : `Set the API server URL for login. Default: ${DEFAULT_API_URL}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label htmlFor="api-server-url" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Server URL
          </label>
          <input
            id="api-server-url"
            type="url"
            value={apiUrlInput}
            onChange={(e) => setApiUrlInput(e.target.value)}
            placeholder={DEFAULT_API_URL}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
            autoFocus
          />
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Example: http://localhost:3000
          </p>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setApiUrlInput(DEFAULT_API_URL);
              setError(null);
              setSuccess(null);
            }}
          >
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApiServerSettingsDialog;
