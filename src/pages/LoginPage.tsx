import * as React from "react";
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

// Floating geometric shapes component
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient orb */}
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-60 blur-3xl animate-float-slow"
        style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(99, 102, 241, 0.3))",
        }}
      />
      <div
        className="absolute top-1/3 -right-10 w-60 h-60 rounded-full opacity-40 blur-2xl animate-float-medium"
        style={{
          background: "linear-gradient(225deg, rgba(236, 72, 153, 0.4), rgba(139, 92, 246, 0.3))",
        }}
      />
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full opacity-30 blur-2xl animate-float-fast"
        style={{
          background: "linear-gradient(45deg, rgba(34, 211, 238, 0.4), rgba(99, 102, 241, 0.2))",
        }}
      />

      {/* Geometric shapes */}
      <svg className="absolute top-20 right-20 w-12 h-12 text-violet-500/20 dark:text-violet-400/10 animate-rotate-slow" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12,2 22,20 2,20" />
      </svg>
      <svg className="absolute bottom-32 right-32 w-8 h-8 text-indigo-500/20 dark:text-indigo-400/10 animate-rotate-reverse" viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
      <svg className="absolute top-1/2 left-16 w-6 h-6 text-pink-500/20 dark:text-pink-400/10 animate-float-fast" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
      </svg>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// Feature item component
function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
      <CheckCircle2 className="h-5 w-5 text-violet-500 dark:text-violet-400 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await login({ email, password });
    if (result.success) {
      // Navigation will be handled by the auth state change
      console.log("Login successful");
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-50 via-indigo-50 to-pink-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 overflow-hidden">
        <FloatingShapes />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                PuraToDo
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-zinc-900 dark:text-white leading-tight mb-6">
            Organize your life,
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              one task at a time.
            </span>
          </h1>

          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-md">
            The minimalist task manager with infinite nested subtasks. Focus on what matters.
          </p>

          {/* Features */}
          <ul className="space-y-4">
            <FeatureItem>Infinite nested subtasks for complex projects</FeatureItem>
            <FeatureItem>Cross-platform sync - desktop & mobile</FeatureItem>
            <FeatureItem>Beautiful, distraction-free interface</FeatureItem>
            <FeatureItem>Offline support with automatic sync</FeatureItem>
          </ul>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/50 dark:from-zinc-900/50 to-transparent" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                PuraToDo
              </span>
            </div>
          </div>

          {/* Form header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Sign in to continue to your tasks
            </p>
          </div>

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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
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
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? "Hide" : "Show"} password
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Sign in</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                New to PuraToDo?
              </span>
            </div>
          </div>

          {/* Register link */}
          <div className="text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 font-medium transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <span>Create an account</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-zinc-400 dark:text-zinc-500">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
