export type AiProfile = 'BASIC' | 'FULL' | 'FULL_HISTORY';

export type PlanLimits = {
    docsPerMonth: number;
    chatMessagesPerMonth: number;
    clinicalImagesPerMonth: number;
    storageHotGb: number;
    activePatients: number | null;
};

export type PlanFeatures = {
    aiProfile: AiProfile;
    storageArchiveIncluded: boolean;
};

// Placeholder for future add-on support
export type ActiveAddon = never;

export const PLAN_LIMITS = {
    STARTER: {
        planCode: 'STARTER' as const,
        name: 'Starter',
        priceMonthlyBrl: 49,
        limits: {
            docsPerMonth: 150,
            chatMessagesPerMonth: 500,
            clinicalImagesPerMonth: 0,
            storageHotGb: 5,
            activePatients: 100,
        },
        features: {
            aiProfile: 'BASIC' as AiProfile,
            storageArchiveIncluded: true,
        },
    },
    CONSULTORIO: {
        planCode: 'CONSULTORIO' as const,
        name: 'Consultório',
        priceMonthlyBrl: 89,
        limits: {
            docsPerMonth: 350,
            chatMessagesPerMonth: 1500,
            clinicalImagesPerMonth: 0,
            storageHotGb: 10,
            activePatients: 300,
        },
        features: {
            aiProfile: 'FULL' as AiProfile,
            storageArchiveIncluded: true,
        },
    },
    CLINICA: {
        planCode: 'CLINICA' as const,
        name: 'Clínica',
        priceMonthlyBrl: 149,
        limits: {
            docsPerMonth: 700,
            chatMessagesPerMonth: 3000,
            clinicalImagesPerMonth: 20,
            storageHotGb: 25,
            activePatients: null,
        },
        features: {
            aiProfile: 'FULL_HISTORY' as AiProfile,
            storageArchiveIncluded: true,
        },
    },
    ESPECIALISTA: {
        planCode: 'ESPECIALISTA' as const,
        name: 'Especialista',
        priceMonthlyBrl: 229,
        limits: {
            docsPerMonth: 1500,
            chatMessagesPerMonth: 5000,
            clinicalImagesPerMonth: 100,
            storageHotGb: 50,
            activePatients: null,
        },
        features: {
            aiProfile: 'FULL_HISTORY' as AiProfile,
            storageArchiveIncluded: true,
        },
    },
} as const;

export type PlanCode = keyof typeof PLAN_LIMITS;

/**
 * Runtime enum-like object used with toEnum() for type-safe Prisma ↔ domain conversion.
 * Values mirror the Prisma PlanCode enum exactly.
 */
export const PlanCodeRecord: Record<PlanCode, PlanCode> = {
    STARTER: 'STARTER',
    CONSULTORIO: 'CONSULTORIO',
    CLINICA: 'CLINICA',
    ESPECIALISTA: 'ESPECIALISTA',
};

export function getPlanLimits(planCode: PlanCode): PlanLimits {
    return PLAN_LIMITS[planCode].limits;
}

// Placeholder — add-on accumulation will be implemented in a future task
export function getEffectiveLimits(planCode: PlanCode, _addons: ActiveAddon[]): PlanLimits {
    return getPlanLimits(planCode);
}
