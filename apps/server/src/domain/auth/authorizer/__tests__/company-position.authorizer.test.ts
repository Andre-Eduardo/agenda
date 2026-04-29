import { mock } from "jest-mock-extended";
import { CompanyId } from "../../../company/entities";
import type { EmployeePositionRepository } from "../../../employee-position/employee-position.repository";
import { fakeEmployeePosition } from "../../../employee-position/entities/__tests__/fake-employee-position";
import { UserId } from "../../../user/entities";
import { ProductPermission, RoomPermission } from "../../permission";
import { CompanyPositionAuthorizer } from "../company-position.authorizer";

describe("A company position authorizer", () => {
  const positionRepository = mock<EmployeePositionRepository>();
  const authorizer = new CompanyPositionAuthorizer(positionRepository);

  it("should return the permissions of the user in the company", async () => {
    const userId = UserId.generate();
    const companyId = CompanyId.generate();
    const permissions = new Set([RoomPermission.VIEW, ProductPermission.DELETE]);
    const position = fakeEmployeePosition({
      name: "Manager",
      permissions,
      createdAt: new Date(1000),
      updatedAt: new Date(1000),
    });

    jest.spyOn(positionRepository, "findByUser").mockResolvedValueOnce(position);

    await expect(authorizer.getPermissions(companyId, userId)).resolves.toEqual(permissions);

    expect(positionRepository.findByUser).toHaveBeenCalledWith(companyId, userId);
  });

  it("should return no permissions if the user has no position in the company", async () => {
    const userId = UserId.generate();
    const companyId = CompanyId.generate();

    jest.spyOn(positionRepository, "findByUser").mockResolvedValueOnce(null);

    await expect(authorizer.getPermissions(companyId, userId)).resolves.toEqual(new Set());

    expect(positionRepository.findByUser).toHaveBeenCalledWith(companyId, userId);
  });

  it("should return no permissions if no company is provided", async () => {
    const userId = UserId.generate();
    const companyId = null;

    await expect(authorizer.getPermissions(companyId, userId)).resolves.toEqual(new Set());
  });
});
