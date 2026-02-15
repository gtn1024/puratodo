"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement actual login logic in Feature 2.3
    setTimeout(() => setIsLoading(false), 1000);
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
            Welcome back
          </h1>
          <p
            className="text-sm text-stone-500 dark:text-stone-400 text-center"
            style={{ animation: "fadeIn 0.8s ease-out 0.4s both" }}
          >
            Sign in to your PuraToDo account
          </p>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            style={{ animation: "fadeIn 0.8s ease-out 0.5s both" }}
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-stone-700 dark:text-stone-300"
              >
                Email
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
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-stone-700 dark:text-stone-300"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-stone-50/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 focus-visible:ring-stone-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 transition-all duration-200 shadow-lg shadow-stone-900/20 dark:shadow-stone-900/40"
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
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div
            className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400"
            style={{ animation: "fadeIn 0.8s ease-out 0.6s both" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-stone-900 hover:text-stone-700 dark:text-stone-100 dark:hover:text-stone-200 transition-colors underline-offset-4 hover:underline"
            >
              Create one
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
