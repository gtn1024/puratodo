import * as React from "react";
import { Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  clearApiUrl,
  DEFAULT_API_URL,
  getStoredApiUrl,
  isValidApiUrl,
  normalizeApiUrl,
  setApiUrl,
} from "@/lib/api/config";

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

  const resetForm = React.useCallback(() => {
    const storedApiUrl = getStoredApiUrl();
    setApiUrlInput(storedApiUrl ?? DEFAULT_API_URL);
    setError(null);
    setSuccess(null);
  }, []);

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
      if (shouldUseDefault) {
        clearApiUrl();
      } else {
        setApiUrl(normalizedApiUrl);
      }

      await onSaved?.();

      setSuccess(shouldUseDefault ? "Saved. Using default API server." : "Saved. Using custom API server.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify API server";
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
            <span>API Server Settings</span>
          </DialogTitle>
          <DialogDescription>
            Set a custom API server URL. Leave it as default to use {DEFAULT_API_URL}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label htmlFor="api-server-url" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Server URL
          </label>
          <input
            id="api-server-url"
            type="url"
            value={apiUrlInput}
            onChange={(e) => setApiUrlInput(e.target.value)}
            placeholder={DEFAULT_API_URL}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            autoFocus
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
