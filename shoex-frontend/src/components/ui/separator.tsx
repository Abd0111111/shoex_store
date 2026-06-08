import * as React from "react";
import { cn } from "@/lib/utils";

export type SeparatorProps = React.HTMLAttributes<HTMLDivElement>;

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <div
      className={cn("h-[1px] w-full bg-white/10 my-4", className)}
      {...props}
    />
  );
}

export default Separator;
