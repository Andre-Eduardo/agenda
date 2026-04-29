export type AiProfile = "BASIC" | "FULL" | "FULL_HISTORY";

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

export type AddonGrantKey =
  | "docsPerMonth"
  | "chatMessagesPerMonth"
  | "clinicalImagesPerMonth"
  | "storageHotGb";

export type AddonGrants = Partial<Pick<PlanLimits, AddonGrantKey>>;

export type AddonCatalogEntry = {
  code: string;
  name: string;
  priceMonthlyBrl: number;
  grants: AddonGrants;
};

export type AddonCode =
  | "EXTRA_DOCS_300"
  | "EXTRA_CHAT_1000"
  | "EXTRA_IMAGES_30"
  | "EXTRA_STORAGE_10GB";

export const ADDON_CATALOG: Record<AddonCode, AddonCatalogEntry> = {
  EXTRA_DOCS_300: {
    code: "EXTRA_DOCS_300",
    name: "+300 documentos",
    priceMonthlyBrl: 12,
    grants: { docsPerMonth: 300 },
  },
  EXTRA_CHAT_1000: {
    code: "EXTRA_CHAT_1000",
    name: "+1.000 mensagens de chat",
    priceMonthlyBrl: 9,
    grants: { chatMessagesPerMonth: 1000 },
  },
  EXTRA_IMAGES_30: {
    code: "EXTRA_IMAGES_30",
    name: "+30 imagens clínicas",
    priceMonthlyBrl: 49,
    grants: { clinicalImagesPerMonth: 30 },
  },
  EXTRA_STORAGE_10GB: {
    code: "EXTRA_STORAGE_10GB",
    name: "+10 GB storage",
    priceMonthlyBrl: 9,
    grants: { storageHotGb: 10 },
  },
};

export const PLAN_LIMITS = {
  STARTER: {
    planCode: "STARTER" as const,
    name: "Starter",
    priceMonthlyBrl: 49,
    limits: {
      docsPerMonth: 150,
      chatMessagesPerMonth: 500,
      clinicalImagesPerMonth: 0,
      storageHotGb: 5,
      activePatients: 100,
    },
    features: {
      aiProfile: "BASIC" as AiProfile,
      storageArchiveIncluded: true,
    },
  },
  CONSULTORIO: {
    planCode: "CONSULTORIO" as const,
    name: "Consultório",
    priceMonthlyBrl: 89,
    limits: {
      docsPerMonth: 350,
      chatMessagesPerMonth: 1500,
      clinicalImagesPerMonth: 0,
      storageHotGb: 10,
      activePatients: 300,
    },
    features: {
      aiProfile: "FULL" as AiProfile,
      storageArchiveIncluded: true,
    },
  },
  CLINICA: {
    planCode: "CLINICA" as const,
    name: "Clínica",
    priceMonthlyBrl: 149,
    limits: {
      docsPerMonth: 700,
      chatMessagesPerMonth: 3000,
      clinicalImagesPerMonth: 20,
      storageHotGb: 25,
      activePatients: null,
    },
    features: {
      aiProfile: "FULL_HISTORY" as AiProfile,
      storageArchiveIncluded: true,
    },
  },
  ESPECIALISTA: {
    planCode: "ESPECIALISTA" as const,
    name: "Especialista",
    priceMonthlyBrl: 229,
    limits: {
      docsPerMonth: 1500,
      chatMessagesPerMonth: 5000,
      clinicalImagesPerMonth: 100,
      storageHotGb: 50,
      activePatients: null,
    },
    features: {
      aiProfile: "FULL_HISTORY" as AiProfile,
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
  STARTER: "STARTER",
  CONSULTORIO: "CONSULTORIO",
  CLINICA: "CLINICA",
  ESPECIALISTA: "ESPECIALISTA",
};

export function getPlanLimits(planCode: PlanCode): PlanLimits {
  return PLAN_LIMITS[planCode].limits;
}

function addAddonGrants(limits: PlanLimits, grants: AddonGrants, quantity: number): PlanLimits {
  return {
    docsPerMonth:
      limits.docsPerMonth +
      (grants.docsPerMonth !== undefined ? grants.docsPerMonth * quantity : 0),
    chatMessagesPerMonth:
      limits.chatMessagesPerMonth +
      (grants.chatMessagesPerMonth !== undefined ? grants.chatMessagesPerMonth * quantity : 0),
    clinicalImagesPerMonth:
      limits.clinicalImagesPerMonth +
      (grants.clinicalImagesPerMonth !== undefined ? grants.clinicalImagesPerMonth * quantity : 0),
    storageHotGb:
      limits.storageHotGb +
      (grants.storageHotGb !== undefined ? grants.storageHotGb * quantity : 0),
    activePatients: limits.activePatients,
  };
}

export function getEffectiveLimits(
  planCode: PlanCode,
  addons: Array<{ addonCode: AddonCode; quantity: number }>,
): PlanLimits {
  let effective: PlanLimits = { ...getPlanLimits(planCode) };

  for (const { addonCode, quantity } of addons) {
    const catalog = ADDON_CATALOG[addonCode];

    effective = addAddonGrants(effective, catalog.grants, quantity);
  }

  return effective;
}
