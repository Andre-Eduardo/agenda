import type { ReactNode } from "react";
import { useCan, type Permission } from "@/hooks/useCan";

type CanChildren = ReactNode | ((allowed: boolean) => ReactNode);

interface CanProps {
  has?: Permission;
  hasAny?: Permission[];
  hasAll?: Permission[];
  granted?: ReactNode;
  denied?: ReactNode;
  children?: CanChildren;
}

export function Can({ has, hasAny, hasAll, granted, denied = null, children }: CanProps) {
  const allowed = useCan({ has, hasAny, hasAll });

  if (typeof children === "function") {
    return <>{children(allowed)}</>;
  }

  if (granted !== undefined || denied !== undefined) {
    return <>{allowed ? granted : denied}</>;
  }

  return allowed ? <>{children}</> : null;
}
