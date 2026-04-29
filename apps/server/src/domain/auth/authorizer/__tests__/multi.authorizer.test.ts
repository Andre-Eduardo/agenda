import { mock } from "jest-mock-extended";
import { CompanyId } from "../../../company/entities";
import { UserId } from "../../../user/entities";
import { RoomCategoryPermission, ProductPermission, SupplierPermission } from "../../permission";
import type { Authorizer } from "../authorizer";
import { MultiAuthorizer } from "../multi.authorizer";

describe("A multi authorizer", () => {
  it("should return the union of the permissions returned by the authorizers", async () => {
    const userId = UserId.generate();
    const companyId = CompanyId.generate();

    const firstAuthorizer = mock<Authorizer>();
    const secondAuthorizer = mock<Authorizer>();
    const thirdAuthorizer = mock<Authorizer>();

    firstAuthorizer.getPermissions.mockResolvedValueOnce(new Set([RoomCategoryPermission.VIEW]));
    secondAuthorizer.getPermissions.mockResolvedValueOnce(
      new Set([ProductPermission.DELETE, SupplierPermission.VIEW]),
    );
    thirdAuthorizer.getPermissions.mockResolvedValueOnce(new Set());

    const authorizer = new MultiAuthorizer(firstAuthorizer, secondAuthorizer, thirdAuthorizer);

    await expect(authorizer.getPermissions(companyId, userId)).resolves.toEqual(
      new Set([RoomCategoryPermission.VIEW, ProductPermission.DELETE, SupplierPermission.VIEW]),
    );

    expect(firstAuthorizer.getPermissions).toHaveBeenCalledWith(companyId, userId);
    expect(secondAuthorizer.getPermissions).toHaveBeenCalledWith(companyId, userId);
    expect(thirdAuthorizer.getPermissions).toHaveBeenCalledWith(companyId, userId);
  });
});
