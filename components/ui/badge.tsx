import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none transition-colors duration-150",
  {
    variants: {
      variant: {
        default:
          "bg-primary-light text-primary-dark dark:bg-primary-dark dark:text-primary-light border-none",
        success:
          "bg-success-light text-success-foreground border-none",
        warning:
          "bg-warning-light text-warning-foreground border-none",
        destructive:
          "bg-destructive-light text-destructive-foreground dark:bg-destructive-light dark:text-destructive-foreground border-none",
        secondary:
          "bg-secondary text-secondary-foreground border border-border-light",
        outline:
          "text-foreground border border-border-medium bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
