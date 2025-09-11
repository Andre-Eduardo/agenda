export enum RoomPermission {
    VIEW = 'room:view',
    CREATE = 'room:create',
    UPDATE = 'room:update',
    DELETE = 'room:delete',
}

export enum RoomCategoryPermission {
    VIEW = 'room-category:view',
    CREATE = 'room-category:create',
    UPDATE = 'room-category:update',
    DELETE = 'room-category:delete',
}

export enum ReservationPermission {
    VIEW = 'reservation:view',
    CREATE = 'reservation:create',
    UPDATE = 'reservation:update',
    CANCEL = 'reservation:cancel',
}

export enum CashierPermission {
    VIEW = 'cashier:view',
    OPEN = 'cashier:open',
    CLOSE = 'cashier:close',
}

export enum CompanyPermission {
    VIEW = 'company:view',
    CREATE = 'company:create',
    UPDATE = 'company:update',
    DELETE = 'company:delete',
}

export enum CustomerPermission {
    VIEW = 'customer:view',
    CREATE = 'customer:create',
    UPDATE = 'customer:update',
    DELETE = 'customer:delete',
}

export enum DefectTypePermission {
    VIEW = 'defect-type:view',
    CREATE = 'defect-type:create',
    UPDATE = 'defect-type:update',
    DELETE = 'defect-type:delete',
}

export enum DefectPermission {
    VIEW = 'defect:view',
    CREATE = 'defect:create',
    UPDATE = 'defect:update',
    FINISH = 'defect:finish',
    DELETE = 'defect:delete',
}

export enum DirectSalePermission {
    VIEW = 'direct-sale:view',
    CREATE = 'direct-sale:create',
    UPDATE = 'direct-sale:update',
}

export enum EmployeePermission {
    VIEW = 'employee:view',
    CREATE = 'employee:create',
    UPDATE = 'employee:update',
    DELETE = 'employee:delete',
}

export enum EmployeePositionPermission {
    VIEW = 'employee-position:view',
    CREATE = 'employee-position:create',
    UPDATE = 'employee-position:update',
    DELETE = 'employee-position:delete',
}

export enum PaymentMethodPermission {
    VIEW = 'payment-method:view',
    CREATE = 'payment-method:create',
    UPDATE = 'payment-method:update',
    DELETE = 'payment-method:delete',
}

export enum ProductPermission {
    VIEW = 'product:view',
    CREATE = 'product:create',
    UPDATE = 'product:update',
    DELETE = 'product:delete',
}

export enum ProductCategoryPermission {
    VIEW = 'product-category:view',
    CREATE = 'product-category:create',
    UPDATE = 'product-category:update',
    DELETE = 'product-category:delete',
}

export enum SupplierPermission {
    VIEW = 'supplier:view',
    CREATE = 'supplier:create',
    UPDATE = 'supplier:update',
    DELETE = 'supplier:delete',
}

export enum TransactionPermission {
    VIEW = 'transaction:view',
    CREATE = 'transaction:create',
    UPDATE = 'transaction:update',
    DELETE = 'transaction:delete',
}

export enum UserPermission {
    VIEW = 'user:view',
    VIEW_PROFILE = 'user:view-profile',
    CREATE = 'user:create',
    UPDATE = 'user:update',
    CHANGE_PASSWORD = 'user:change-password',
    DELETE = 'user:delete',
}

export enum ServiceCategoryPermission {
    VIEW = 'service-category:view',
    CREATE = 'service-category:create',
    UPDATE = 'service-category:update',
    DELETE = 'service-category:delete',
}

export enum ServicePermission {
    VIEW = 'service:view',
    CREATE = 'service:create',
    UPDATE = 'service:update',
    DELETE = 'service:delete',
}

export enum CleaningPermission {
    VIEW = 'cleaning:view',
    START = 'cleaning:start',
    FINISH = 'cleaning:finish',
}

export enum MaintenancePermission {
    VIEW = 'maintenance:view',
    START = 'maintenance:start',
    UPDATE = 'maintenance:update',
    FINISH = 'maintenance:finish',
}

export enum InspectionPermission {
    VIEW = 'inspection:view',
    APPROVE = 'inspection:approve',
    REJECT = 'inspection:reject',
}

export enum BlockadePermission {
    VIEW = 'blockade:view',
    START = 'blockade:start',
    UPDATE = 'blockade:update',
    FINISH = 'blockade:finish',
}

export enum DeepCleaningPermission {
    VIEW = 'deep-cleaning:view',
    START = 'deep-cleaning:start',
    FINISH = 'deep-cleaning:finish',
}

export enum AccountPermission {
    VIEW = 'account:view',
    CREATE = 'account:create',
    UPDATE = 'account:update',
    DELETE = 'account:delete',
}

export enum AuditPermission {
    VIEW = 'audit:view',
    START = 'audit:start',
    FINISH = 'audit:finish',
}

export enum StockPermission {
    VIEW = 'stock:view',
    CREATE = 'stock:create',
    UPDATE = 'stock:update',
    DELETE = 'stock:delete',
}

const PERMISSIONS = [
    ...Object.values(RoomPermission),
    ...Object.values(RoomCategoryPermission),
    ...Object.values(ReservationPermission),
    ...Object.values(CashierPermission),
    ...Object.values(CompanyPermission),
    ...Object.values(CustomerPermission),
    ...Object.values(DefectTypePermission),
    ...Object.values(DefectPermission),
    ...Object.values(DirectSalePermission),
    ...Object.values(EmployeePermission),
    ...Object.values(EmployeePositionPermission),
    ...Object.values(PaymentMethodPermission),
    ...Object.values(ProductPermission),
    ...Object.values(ProductCategoryPermission),
    ...Object.values(SupplierPermission),
    ...Object.values(TransactionPermission),
    ...Object.values(UserPermission),
    ...Object.values(ServiceCategoryPermission),
    ...Object.values(ServicePermission),
    ...Object.values(CleaningPermission),
    ...Object.values(MaintenancePermission),
    ...Object.values(InspectionPermission),
    ...Object.values(BlockadePermission),
    ...Object.values(DeepCleaningPermission),
    ...Object.values(AccountPermission),
    ...Object.values(AuditPermission),
    ...Object.values(StockPermission),
];

export type Permission = (typeof PERMISSIONS)[number];

// eslint-disable-next-line @typescript-eslint/no-namespace -- Allow for declaration merging
export namespace Permission {
    export function of(value: string): Permission {
        if (!PERMISSIONS.includes(value as Permission)) {
            throw new Error(`Unknown permission: ${value}`);
        }

        return value as Permission;
    }

    export function all(): Set<Permission> {
        return new Set(PERMISSIONS);
    }
}
