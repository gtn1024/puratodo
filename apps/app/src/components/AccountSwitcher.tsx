import * as React from "react";
import { Check, ChevronDown, UserPlus, Users, LogOut, Server, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountSettingsDialog } from "@/components/AccountSettingsDialog";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_API_URL } from "@/lib/api/config";

interface AccountSwitcherProps {
  onAccountChanged: () => Promise<void> | void;
}

function getServerShortName(serverUrl: string | null): string {
  if (!serverUrl || serverUrl === DEFAULT_API_URL) {
    return "local";
  }
  try {
    const url = new URL(serverUrl);
    // Get hostname without www. and port
    let host = url.hostname.replace(/^www\./, "");
    // Shorten to first part if it's a domain
    const parts = host.split(".");
    if (parts.length > 1) {
      host = parts[0];
    }
    return host;
  } catch {
    return "custom";
  }
}

export function AccountSwitcher({
  onAccountChanged,
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { user, accounts, activeAccountId, switchAccount, getCurrentServerUrl } = useAuthStore();
  const { logout } = useAuth();

  const currentAccount = React.useMemo(
    () => accounts.find((account) => account.id === activeAccountId),
    [accounts, activeAccountId]
  );

  const currentServerUrl = getCurrentServerUrl();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSwitchAccount = async (accountId: string) => {
    switchAccount(accountId);
    await onAccountChanged();
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    // Sign out completely (removes all accounts) - goes to login page
    await logout();
  };

  const handleAddAccount = async () => {
    setIsOpen(false);
    // Sign out of current account but keep other accounts for later switching
    // This will go to login page if there are no other accounts, or switch to another account
    useAuthStore.getState().signOutCurrentAccount();
  };

  // Sort accounts by last used
  const sortedAccounts = React.useMemo(
    () =>
      [...accounts].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)),
    [accounts]
  );

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current account button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
          {user.email?.[0]?.toUpperCase() || "U"}
        </div>

        {/* Email and server */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-32">
            {user.email}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Server className="w-3 h-3" />
            <span>{getServerShortName(currentServerUrl)}</span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 z-50">
          {/* Account list */}
          <div className="px-2 py-1">
            <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1">
              Accounts
            </div>
            {sortedAccounts.map((account) => {
              const isActive = account.id === activeAccountId;
              const serverShortName = getServerShortName(account.serverUrl);

              return (
                <button
                  key={account.id}
                  onClick={() => !isActive && handleSwitchAccount(account.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-violet-50 dark:bg-violet-900/20"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                  disabled={isActive}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {account.user.email?.[0]?.toUpperCase() || "U"}
                  </div>

                  {/* Email and server */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {account.user.email}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Server className="w-3 h-3" />
                      <span>{serverShortName}</span>
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <Check className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />

          {/* Add new account */}
          <button
            onClick={handleAddAccount}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add new account</span>
          </button>

          {/* Manage accounts */}
          <AccountSettingsDialog
            onAccountChanged={onAccountChanged}
            trigger={
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                <Users className="w-4 h-4" />
                <span>Manage accounts</span>
              </button>
            }
          />

          {/* Divider */}
          <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountSwitcher;
