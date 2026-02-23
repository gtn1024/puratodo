"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm`,
      });

      if (resetError) {
        setError(resetError.message);
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
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
        <Card className="w-full max-w-md border-stone-200/60 dark:border-stone-800/60 shadow-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {t("auth.checkEmail")}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {t("auth.resetLinkSent")} <span className="font-medium text-stone-700 dark:text-stone-300">{email}</span>
            </p>
            <Link
              href="/login"
              className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            >
              {t("auth.backToLogin")}
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <Card className="w-full max-w-md border-stone-200/60 dark:border-stone-800/60 shadow-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white dark:text-stone-900" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-center text-stone-900 dark:text-stone-100">
            {t("auth.forgotPassword")}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            {t("auth.enterEmailReset")}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-stone-700 dark:text-stone-300">
                {t("auth.email")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.placeholders.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="bg-stone-50/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 focus-visible:ring-stone-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 transition-all duration-200 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("auth.sending")}
                </span>
              ) : (
                t("auth.sendResetLink")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            {t("auth.rememberPassword")}{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
            >
              {t("auth.signIn")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
