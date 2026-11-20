import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva("btn disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      primary: "bg-ink text-page hover:bg-accent hover:text-accent-ink",
      secondary: "border border-line-strong bg-transparent text-ink hover:border-ink hover:bg-surface",
      ghost: "text-muted hover:bg-surface hover:text-ink",
    },
    size: {
      default: "",
      sm: "btn-sm",
      icon: "h-10 w-10 p-0",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
