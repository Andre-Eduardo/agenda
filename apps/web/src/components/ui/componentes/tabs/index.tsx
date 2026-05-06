'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import {clsx} from 'clsx';

import styles from './tabs.module.css';

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={clsx(styles.tabsList, className)}
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
      className={clsx(styles.tabsTrigger, className)}
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
      className={clsx(styles.tabsContent, className)}
      {...props}
    />
  );
}

export {Tabs, TabsList, TabsTrigger, TabsContent};
