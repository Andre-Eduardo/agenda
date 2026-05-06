import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-(--radius-input) text-sm font-medium transition-colors duration-(--duration-fast) ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-(--color-primary) text-white hover:bg-(--color-primary)/90",
        destructive:
          "bg-(--color-danger) text-white hover:bg-(--color-danger)/90",
        outline:
          "border border-(--color-border) bg-(--color-bg-card) text-(--color-text-primary) hover:bg-(--color-bg-surface) hover:border-(--color-border-hover)",
        secondary:
          "bg-(--color-bg-surface) text-(--color-text-secondary) hover:bg-(--color-border) hover:text-(--color-text-primary)",
        ghost:
          "text-(--color-text-secondary) hover:bg-(--color-bg-surface) hover:text-(--color-text-primary)",
        link:
          "text-(--color-primary-text) underline-offset-4 hover:underline",
        ai:
          "bg-(--color-ai-badge-bg) text-white hover:bg-[#0F766E]",
      },
      size: {
        default: "h-[38px] px-4",
        sm: "h-[32px] px-3 text-xs",
        lg: "h-[42px] px-6",
        icon: "size-9",
        "icon-sm": "size-7 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  );
}

export { Button, buttonVariants };
