import * as React from "react";
import { Mail, Lock, ArrowRight, AlertCircle, Server } from "lucide-react";
import { Button, Input } from "@puratodo/ui";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { DEFAULT_API_URL, getPendingApiUrl, setPendingApiUrl, isValidApiUrl, normalizeApiUrl } from "@/lib/api/config";

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverUrl, setServerUrl] = React.useState(() => getPendingApiUrl() ?? DEFAULT_API_URL);
  const [serverUrlError, setServerUrlError] = React.useState("");
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate server URL
    const normalizedUrl = normalizeApiUrl(serverUrl);
    const shouldUseDefault = normalizedUrl.length === 0 || normalizedUrl === DEFAULT_API_URL;
    if (!shouldUseDefault && !isValidApiUrl(normalizedUrl)) {
      setServerUrlError(t("apiServer.invalidUrl"));
      return;
    }
    setServerUrlError("");

    // Save the server URL as pending for the login
    setPendingApiUrl(shouldUseDefault ? DEFAULT_API_URL : normalizedUrl);

    const result = await login({ email, password });
    if (result.success) {
      // Navigation will be handled by the auth state change
      console.log("Login successful");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      {/* Subtle animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30 dark:opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.02 85) 0%, transparent 50%)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-30 dark:opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.03 180) 0%, transparent 50%)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-md relative z-10 rounded-xl border border-stone-200/60 dark:border-stone-800/60 shadow-2xl shadow-stone-900/5 dark:shadow-stone-900/30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl p-8"
        style={{ animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Logo / Brand */}
        <div
          className="flex items-center justify-center mb-4"
          style={{ animation: "fadeIn 0.8s ease-out 0.2s both" }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 flex items-center justify-center shadow-lg shadow-stone-900/20 dark:shadow-stone-900/40">
              <svg className="w-6 h-6 text-white dark:text-stone-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-900" />
          </div>
        </div>

        <h1
          className="text-2xl font-semibold tracking-tight text-center text-stone-900 dark:text-stone-100 mb-1"
          style={{ animation: "fadeIn 0.8s ease-out 0.3s both" }}
        >
          {t("auth.welcomeBack")}
        </h1>
        <p
          className="text-sm text-stone-500 dark:text-stone-400 text-center mb-6"
          style={{ animation: "fadeIn 0.8s ease-out 0.4s both" }}
        >
          {t("auth.signInToAccount")}
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          style={{ animation: "fadeIn 0.8s ease-out 0.5s both" }}
        >
          {/* Server URL */}
          <div className="space-y-2">
            <label
              htmlFor="server-url"
              className="text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              {t("apiServer.title")}
            </label>
            <Input
              id="server-url"
              type="url"
              placeholder={DEFAULT_API_URL}
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value);
                setServerUrlError("");
              }}
              icon={<Server className="h-5 w-5" />}
              error={serverUrlError}
              disabled={isLoading}
            />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t("login.serverHint")}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              {t("auth.email")}
            </label>
            <Input
              id="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-5 w-5" />}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                {t("auth.password")}
              </label>
              <a
                href="#"
                className="text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                {t("auth.forgotPassword")}
              </a>
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-5 w-5" />}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? t("login.hidePassword") : t("login.showPassword")}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-100 transition-all duration-200 shadow-lg shadow-stone-900/20 dark:shadow-stone-900/40"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t("auth.signingIn")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{t("auth.signIn")}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </form>

        <div
          className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400"
          style={{ animation: "fadeIn 0.8s ease-out 0.6s both" }}
        >
          {t("auth.dontHaveAccount")}{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
          >
            {t("auth.createOne")}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-stone-400 dark:text-stone-500">
          {t("login.bySigningIn")}{" "}
          <a href="#" className="underline hover:text-stone-600 dark:hover:text-stone-300">
            {t("login.termsOfService")}
          </a>{" "}
          {t("login.and")}{" "}
          <a href="#" className="underline hover:text-stone-600 dark:hover:text-stone-300">
            {t("login.privacyPolicy")}
          </a>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
