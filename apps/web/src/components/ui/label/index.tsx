import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-[13px] font-medium leading-[1.3] text-(--color-text-primary) peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

function Label({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>) {
  return <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />;
}

export { Label };
