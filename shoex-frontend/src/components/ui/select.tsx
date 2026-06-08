import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel?: string;
  setSelectedLabel: (label: string) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

export function Select({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<string>("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
      <div ref={containerRef} className="relative w-full md:w-auto">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within a Select");

  return (
    <button
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-white/10 bg-[#16161a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#dc143c] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within a Select");
  
  return <span>{context.selectedLabel || placeholder}</span>;
}

export function SelectContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within a Select");

  if (!context.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full min-w-[12rem] overflow-y-auto rounded-md border border-white/10 bg-[#1a1a1f] text-white shadow-md",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

export function SelectItem({
  className,
  value,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within a Select");

  const isSelected = context.value === value;

  React.useEffect(() => {
    if (isSelected && typeof children === "string") {
      context.setSelectedLabel(children);
    }
  }, [isSelected, children]);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (context.onValueChange) {
      context.onValueChange(value);
    }
    if (typeof children === "string") {
      context.setSelectedLabel(children);
    }
    context.setOpen(false);
  };

  return (
    <div
      onClick={handleSelect}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-white/5 focus:bg-white/5 transition-colors",
        isSelected && "text-white font-medium",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4 text-[#dc143c]" />}
      </span>
      {children}
    </div>
  );
}
