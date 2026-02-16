import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-zinc-200 bg-white/80 px-4 py-2 text-sm text-zinc-900 transition-all duration-200",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
            "focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100",
            "dark:focus:border-violet-400 dark:focus:ring-violet-400/20",
            icon && "pl-11",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
