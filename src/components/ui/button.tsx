import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cn-orange text-white shadow-md shadow-cn-orange/25 hover:bg-cn-orange-hover focus-visible:outline-cn-orange",
  secondary:
    "border border-cn-border bg-cn-surface text-cn-ink shadow-sm hover:border-cn-border-strong hover:bg-cn-canvas focus-visible:outline-cn-ink",
  ghost:
    "text-cn-ink-muted hover:bg-cn-ink/5 hover:text-cn-ink focus-visible:outline-cn-ink",
  dark:
    "bg-cn-sidebar text-white hover:bg-cn-sidebar/90 focus-visible:outline-cn-sidebar",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-full px-4 text-xs font-semibold",
  md: "h-11 rounded-xl px-5 text-sm font-semibold",
  lg: "h-12 rounded-2xl px-6 text-sm font-bold",
  icon: "h-11 w-11 rounded-2xl p-0",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
