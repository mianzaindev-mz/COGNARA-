import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#ff5734] text-white shadow-md shadow-[#ff5734]/25 hover:bg-[#e64a2e] focus-visible:outline-[#ff5734]",
  secondary:
    "border border-[#151313]/15 bg-white text-[#151313] shadow-sm hover:border-[#151313]/30 hover:bg-[#f7f7f5] focus-visible:outline-[#151313]",
  ghost:
    "text-[#151313]/70 hover:bg-[#151313]/05 hover:text-[#151313] focus-visible:outline-[#151313]",
  dark:
    "bg-[#151313] text-white hover:bg-[#2a2828] focus-visible:outline-[#151313]",
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
