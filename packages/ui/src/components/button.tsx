import * as React from "react";
import { cn } from "../lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "default" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-cobalt text-inverse hover:bg-[#1543b3]",
    secondary: "bg-surface text-ink border border-border hover:bg-surface-subtle hover:border-border-hover",
    ghost: "bg-transparent text-ink hover:bg-surface-subtle",
    danger: "text-error hover:bg-[#FBEDED]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-sans font-medium rounded-sm transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-cobalt focus-visible:outline-2 focus-visible:outline-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
