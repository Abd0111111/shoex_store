import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc143c] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95 duration-100",
          variant === "default" && "bg-[#dc143c] text-white hover:bg-[#dc143c]/90 shadow-lg shadow-[#dc143c]/20",
          variant === "outline" && "border border-white/10 bg-transparent text-white hover:bg-white/5",
          variant === "ghost" && "text-gray-300 hover:text-white hover:bg-white/5",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-8 rounded-md px-3 text-xs",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
export default Button;
