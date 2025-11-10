import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[42px] w-full rounded-lg border border-border-medium bg-card px-3.5 py-2.5 text-[15px] text-foreground shadow-xs outline-none transition-all duration-150",
        "placeholder:text-muted-foreground",
        "focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "aria-invalid:border-destructive aria-invalid:focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
