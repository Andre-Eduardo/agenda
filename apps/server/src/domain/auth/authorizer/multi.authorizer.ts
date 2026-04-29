import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { UserId } from "@domain/user/entities";
import type { Permission } from "@domain/auth/permission";
import { Authorizer } from "@domain/auth/authorizer/authorizer";

export class MultiAuthorizer extends Authorizer {
  private readonly authorizers: readonly Authorizer[];

  constructor(...authorizers: Authorizer[]) {
    super();
    this.authorizers = authorizers;
  }

  async getPermissions(
    clinicMemberId: ClinicMemberId | null,
    userId: UserId,
  ): Promise<Set<Permission>> {
    const results = await Promise.all(
      this.authorizers.map((authorizer) => authorizer.getPermissions(clinicMemberId, userId)),
    );

    return results.reduce((permissions, result) => {
      for (const permission of result) {
        permissions.add(permission);
      }

      return permissions;
    }, new Set<Permission>());
  }
}
