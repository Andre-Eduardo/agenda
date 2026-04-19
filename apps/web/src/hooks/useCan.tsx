export type Permission = string;

export interface CanOptions {
  has: Permission | Permission[];
}

export function useCan() {
  return {
    can: (_permission: Permission | Permission[]) => true,
  };
}

export function Can({ children }: { has: Permission | Permission[]; children: React.ReactNode }) {
  return <>{children}</>;
}
