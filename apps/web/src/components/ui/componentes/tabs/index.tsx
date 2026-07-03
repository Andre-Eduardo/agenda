'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import {cx} from '@/styled-system/css';
import {tabsContent, tabsList, tabsTrigger} from './styles';

const Tabs = TabsPrimitive.Root;

function TabsList({className, ref, ...props}: React.ComponentProps<typeof TabsPrimitive.List>) {
    return <TabsPrimitive.List ref={ref} className={cx(tabsList, className)} {...props} />;
}

function TabsTrigger({className, ref, ...props}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return <TabsPrimitive.Trigger ref={ref} className={cx(tabsTrigger, className)} {...props} />;
}

function TabsContent({className, ref, ...props}: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return <TabsPrimitive.Content ref={ref} className={cx(tabsContent, className)} {...props} />;
}

export {Tabs, TabsList, TabsTrigger, TabsContent};
