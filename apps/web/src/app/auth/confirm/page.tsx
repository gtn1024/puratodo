"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n";

function AuthConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authType, setAuthType] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      const type = searchParams.get("type");
      const email = searchParams.get("email");

      if (!token || !type) {
        setError(t("auth.confirm.invalidLink"));
        setLoading(false);
        setVerifying(false);
        return;
      }

      setAuthType(type);

      try {
        const supabase = createClient();

        // For invite and recovery, we need to verify the OTP first
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as "signup" | "invite" | "recovery" | "magiclink" | "email_change",
        });

        if (verifyError) {
          // If verification fails, the link might be expired or invalid
          setError(verifyError.message);
          setLoading(false);
          setVerifying(false);
          return;
        }

        // For signup/email_change, user is verified - redirect to home
        if (type === "signup" || type === "email_change" || type === "magiclink") {
          router.push("/");
          return;
        }

        // For invite and recovery, show password form
        setVerifying(false);
        setLoading(false);
      } catch {
        setError(t("auth.confirm.unexpectedError"));
        setLoading(false);
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, router, t]);

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

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch {
      setError(t("auth.unexpectedError"));
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading && verifying) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
        <Card className="w-full max-w-md border-stone-200/60 dark:border-stone-800/60 shadow-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl">
          <CardContent className="pt-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-800 dark:border-stone-600 dark:border-t-stone-200 rounded-full mx-auto mb-4" />
            <p className="text-stone-600 dark:text-stone-400">{t("auth.confirm.verifying")}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Success state
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
        <Card className="w-full max-w-md border-stone-200/60 dark:border-stone-800/60 shadow-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {t("auth.confirm.passwordSetSuccess")}
            </h2>
            <p className="text-stone-500 dark:text-stone-400">
              {t("auth.confirm.redirecting")}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Error state
  if (error && !authType) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
        <Card className="w-full max-w-md border-stone-200/60 dark:border-stone-800/60 shadow-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {t("auth.confirm.linkInvalidOrExpired")}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-4">
              {error}
            </p>
            <Button onClick={() => router.push("/login")} className="bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900">
              {t("auth.confirm.backToLogin")}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Password form for invite/recovery
  const isInvite = authType === "invite";
  const isRecovery = authType === "recovery";

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
            {isInvite ? t("auth.confirm.welcomeToPuraToDo") : t("auth.confirm.resetYourPassword")}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            {isInvite ? t("auth.confirm.setPasswordComplete") : t("auth.confirm.enterNewPassword")}
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
              <Label htmlFor="password" className="text-stone-700 dark:text-stone-300">
                {t("auth.confirm.newPassword")}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.placeholders.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="bg-stone-50/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 focus-visible:ring-stone-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-stone-700 dark:text-stone-300">
                {t("auth.confirm.confirmPasswordLabel")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("auth.placeholders.password")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-stone-50/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 focus-visible:ring-stone-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 transition-all duration-200 shadow-lg"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("auth.confirm.settingPassword")}
                </span>
              ) : (
                isInvite ? t("auth.confirm.completeSetup") : t("auth.confirm.resetPasswordBtn")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-800 dark:border-stone-600 dark:border-t-stone-200 rounded-full" />
      </main>
    }>
      <AuthConfirmContent />
    </Suspense>
  );
}
