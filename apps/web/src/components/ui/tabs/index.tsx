"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'flex border-b border-(--color-border) bg-(--color-bg-surface) px-1.5 pt-1.5 h-auto items-stretch justify-start',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-[10px] whitespace-nowrap',
        'rounded-t-[8px] rounded-b-none border-b-2 border-transparent -mb-px',
        'px-4 py-[14px] text-[13px] font-medium leading-[1.3] text-(--color-text-secondary)',
        'transition-all duration-(--duration-fast) ease-out',
        'hover:bg-(--color-bg-card) hover:text-(--color-text-primary)',
        'data-[state=active]:border-(--color-primary) data-[state=active]:bg-(--color-bg-card) data-[state=active]:text-(--color-primary-text)',
        'focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn('focus-visible:outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
