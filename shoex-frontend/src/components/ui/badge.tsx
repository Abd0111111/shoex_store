import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        variant === "default" && "border-transparent bg-[#dc143c] text-white",
        variant === "secondary" && "border-transparent bg-[#1f1f23] text-gray-300",
        variant === "destructive" && "border-transparent bg-red-500/10 text-red-500",
        variant === "outline" && "border-white/10 text-gray-300",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export default Badge;
