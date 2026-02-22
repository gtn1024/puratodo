import * as React from "react";
import { Check, ChevronDown, UserPlus, Users, LogOut, Server } from "lucide-react";
import { AccountSettingsDialog } from "@/components/AccountSettingsDialog";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
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
  const { t } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"add" | "manage" | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { user, accounts, activeAccountId, switchAccount, getCurrentServerUrl } = useAuthStore();
  const { logout } = useAuth();

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

  const handleOpenAddAccount = () => {
    setIsOpen(false);
    setDialogMode("add");
  };

  const handleOpenManageAccounts = () => {
    setIsOpen(false);
    setDialogMode("manage");
  };

  const handleCloseDialog = () => {
    setDialogMode(null);
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
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Current account button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-700 to-stone-500 flex items-center justify-center text-white dark:text-stone-100 text-sm font-medium">
            {user.email?.[0]?.toUpperCase() || "U"}
          </div>

          {/* Email and server */}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate max-w-32">
              {user.email}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Server className="w-3 h-3" />
              <span>{getServerShortName(currentServerUrl)}</span>
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`w-4 h-4 text-stone-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg py-1 z-50">
            {/* Account list */}
            <div className="px-2 py-1">
              <div className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider px-2 py-1">
                {t("account.accounts")}
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
                        ? "bg-stone-100 dark:bg-stone-700"
                        : "hover:bg-stone-100 dark:hover:bg-stone-700"
                    }`}
                    disabled={isActive}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-700 to-stone-500 flex items-center justify-center text-white dark:text-stone-100 text-sm font-medium flex-shrink-0">
                      {account.user.email?.[0]?.toUpperCase() || "U"}
                    </div>

                    {/* Email and server */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                        {account.user.email}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        <span>{serverShortName}</span>
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <Check className="w-4 h-4 text-stone-600 dark:text-stone-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-stone-200 dark:bg-stone-700 my-1" />

            {/* Add new account */}
            <button
              onClick={handleOpenAddAccount}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("account.addAccount")}</span>
            </button>

            {/* Manage accounts */}
            <button
              onClick={handleOpenManageAccounts}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>{t("account.manageAccounts")}</span>
            </button>

            {/* Divider */}
            <div className="h-px bg-stone-200 dark:bg-stone-700 my-1" />

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("account.signOut")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dialogs - rendered outside dropdown */}
      <AccountSettingsDialog
        open={dialogMode === "add"}
        onOpenChange={(open) => !open && handleCloseDialog()}
        onAccountChanged={onAccountChanged}
        defaultIsAdding={true}
      />

      <AccountSettingsDialog
        open={dialogMode === "manage"}
        onOpenChange={(open) => !open && handleCloseDialog()}
        onAccountChanged={onAccountChanged}
      />
    </>
  );
}

export default AccountSwitcher;
