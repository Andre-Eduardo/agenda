import { cn } from '@/lib/utils';
import { type VariantProps } from 'class-variance-authority';
import { inputVariants } from '@/components/ui/input';

export interface TextareaProps
  extends React.ComponentProps<'textarea'>,
    VariantProps<typeof inputVariants> {}

function Textarea({ className, appearance, state, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      className={cn(inputVariants({ appearance, state }), 'min-h-[80px] resize-y', className)}
      {...props}
    />
  );
}

export { Textarea };
