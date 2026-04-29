import { Injectable } from "@nestjs/common";
import { AccessDeniedException, AccessDeniedReason } from "@domain/@shared/exceptions";
import type { ClinicId } from "@domain/clinic/entities";

/**
 * Validates that domain entities belong to the same clinic (tenant).
 * Throws AccessDeniedException on mismatch to prevent cross-tenant data leakage.
 */
@Injectable()
export class CrossTenantValidator {
  /**
   * Asserts that all provided clinicIds are equal to the expected clinicId.
   * Call this before any operation that joins entities from potentially different tenants.
   */
  assertSameTenant(expected: ClinicId, ...others: ClinicId[]): void {
    for (const other of others) {
      if (!expected.equals(other)) {
        throw new AccessDeniedException(
          "Cross-tenant access detected",
          AccessDeniedReason.NOT_ALLOWED,
        );
      }
    }
  }

  /**
   * Asserts that an entity's clinicId matches the actor's current clinic context.
   * Use this when loading an entity and before returning or mutating it.
   */
  assertEntityBelongsToClinic(entityClinicId: ClinicId, actorClinicId: ClinicId): void {
    if (!entityClinicId.equals(actorClinicId)) {
      throw new AccessDeniedException(
        "Cross-tenant access detected",
        AccessDeniedReason.NOT_ALLOWED,
      );
    }
  }
}
