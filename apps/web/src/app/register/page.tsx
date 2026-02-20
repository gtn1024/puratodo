"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n";

const ENABLE_REGISTRATION = process.env.NEXT_PUBLIC_ENABLE_REGISTRATION !== "false";

export default function RegisterPage() {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Show disabled message if registration is turned off
  if (!ENABLE_REGISTRATION) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
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
        </div>

        <Card
          className="w-full max-w-md relative z-10 border-stone-200/60 dark:border-stone-800/60 shadow-2xl shadow-stone-900/5 dark:shadow-stone-900/30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl"
          style={{
            animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {t("auth.registrationDisabled")}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {t("auth.contactAdmin")}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-100 px-4 py-2"
            >
              {t("auth.backToLogin")}
            </Link>
          </CardContent>
        </Card>

        <style jsx global>{`
          @keyframes float {
            0%,
            100% {
              transform: translate(0, 0) rotate(0deg);
            }
            33% {
              transform: translate(30px, -30px) rotate(5deg);
            }
            66% {
              transform: translate(-20px, 20px) rotate(-5deg);
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t("auth.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
        {/* Background shapes */}
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
        </div>

        <Card
          className="w-full max-w-md relative z-10 border-stone-200/60 dark:border-stone-800/60 shadow-2xl shadow-stone-900/5 dark:shadow-stone-900/30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl"
          style={{
            animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {t("auth.checkEmail")}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {t("auth.confirmationSent")} <span className="font-medium text-stone-700 dark:text-stone-300">{email}</span></p>
            <Link
              href="/login"
              className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            >
              {t("auth.backToLogin")}
            </Link>
          </CardContent>
        </Card>

        <style jsx global>{`
          @keyframes float {
            0%,
            100% {
              transform: translate(0, 0) rotate(0deg);
            }
            33% {
              transform: translate(30px, -30px) rotate(5deg);
            }
            66% {
              transform: translate(-20px, 20px) rotate(-5deg);
            }
          }
        `}</style>
      </main>
    );
  }

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

      {/* Register Card */}
      <Card
        className="w-full max-w-md relative z-10 border-stone-200/60 dark:border-stone-800/60 shadow-2xl shadow-stone-900/5 dark:shadow-stone-900/30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl"
        style={{
          animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <CardHeader className="space-y-1 pb-2">
          {/* Logo / Brand */}
          <div
            className="flex items-center justify-center mb-4"
            style={{ animation: "fadeIn 0.8s ease-out 0.2s both" }}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 flex items-center justify-center shadow-lg shadow-stone-900/20 dark:shadow-stone-900/40">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-white dark:text-stone-900"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-900" />
            </div>
          </div>

          <h1
            className="text-2xl font-semibold tracking-tight text-center text-stone-900 dark:text-stone-100"
            style={{ animation: "fadeIn 0.8s ease-out 0.3s both" }}
          >
            {t("auth.createAccount")}
          </h1>
          <p
            className="text-sm text-stone-500 dark:text-stone-400 text-center"
            style={{ animation: "fadeIn 0.8s ease-out 0.4s both" }}
          >
            {t("auth.getStarted")}
          </p>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            style={{ animation: "fadeIn 0.8s ease-out 0.5s both" }}
          >
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-stone-700 dark:text-stone-300"
              >
                {t("auth.email")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-stone-50/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 focus-visible:ring-stone-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-stone-700 dark:text-stone-300"
              >
                {t("auth.password")}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-stone-50/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 focus-visible:ring-stone-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-stone-700 dark:text-stone-300"
              >
                {t("auth.confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-stone-50/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 focus-visible:ring-stone-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-100 transition-all duration-200 shadow-lg shadow-stone-900/20 dark:shadow-stone-900/40"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("auth.creatingAccount")}
                </span>
              ) : (
                t("auth.createAccount")
              )}
            </Button>
          </form>

          <div
            className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400"
            style={{ animation: "fadeIn 0.8s ease-out 0.6s both" }}
          >
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
            >
              {t("auth.signIn")}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(5deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(-5deg);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
