import { mockDeep } from "jest-mock-extended";
import { DocumentId, Phone } from "../../../domain/@shared/value-objects";
import { CompanyId } from "../../../domain/company/entities";
import type { Person } from "../../../domain/person/entities";
import { Gender, PersonProfile, PersonType } from "../../../domain/person/entities";
import { fakePerson } from "../../../domain/person/entities/__tests__/fake-person";
import type { PersonModel } from "../index";
import { PersonPrismaRepository } from "../index";
import type { PrismaService } from "../prisma";

describe("A person repository backed by Prisma ORM", () => {
  const prisma = mockDeep<PrismaService>();
  const repository = new PersonPrismaRepository(prisma);
  const companyId = CompanyId.generate();
  const domainPersons: Person[] = [
    fakePerson({
      name: "My name 1",
      profiles: new Set([PersonProfile.CUSTOMER]),
      personType: PersonType.NATURAL,
      documentId: DocumentId.create("12345678901"),
      gender: undefined,
      phone: Phone.create("12345678901"),
    }),
    fakePerson({
      name: "My name 2",
      documentId: DocumentId.create("12345678923"),
      profiles: new Set([PersonProfile.CUSTOMER]),
      companyName: null,
      personType: PersonType.LEGAL,
      companyId,
      phone: null,
    }),
    fakePerson({
      name: "My name 3",
      documentId: DocumentId.create("12345678999"),
      profiles: new Set([PersonProfile.CUSTOMER]),
      personType: PersonType.NATURAL,
      companyId,
      gender: Gender.MALE,
      phone: Phone.create("12345678911"),
    }),
  ];

  const databasePersons: PersonModel[] = [
    {
      id: domainPersons[0].id.toString(),
      name: domainPersons[0].name,
      documentId: domainPersons[0].documentId.toString(),
      companyId: domainPersons[0].companyId.toString(),
      companyName: domainPersons[0].companyName ?? null,
      phone: domainPersons[0].phone === null ? null : domainPersons[0].phone.toString(),
      personType: domainPersons[0].personType,
      profiles: [...domainPersons[0].profiles],
      gender: domainPersons[0].gender ?? null,
      createdAt: domainPersons[0].createdAt,
      updatedAt: domainPersons[0].updatedAt,
    },
    {
      id: domainPersons[1].id.toString(),
      name: domainPersons[1].name,
      documentId: domainPersons[1].documentId.toString(),
      companyId: domainPersons[1].companyId.toString(),
      companyName: domainPersons[1].companyName ?? null,
      profiles: [...domainPersons[1].profiles],
      personType: domainPersons[1].personType,
      gender: domainPersons[1].gender ?? null,
      phone: domainPersons[1].phone === null ? null : domainPersons[1].phone.toString(),

      createdAt: domainPersons[1].createdAt,
      updatedAt: domainPersons[1].updatedAt,
    },
    {
      id: domainPersons[2].id.toString(),
      name: domainPersons[2].name,
      documentId: domainPersons[2].documentId.toString(),
      companyId: domainPersons[2].companyId.toString(),
      phone: domainPersons[2].phone === null ? null : domainPersons[2].phone.toString(),
      companyName: domainPersons[2].companyName ?? null,
      profiles: [...domainPersons[2].profiles],
      personType: domainPersons[2].personType,
      gender: domainPersons[2].gender ?? null,
      createdAt: domainPersons[2].createdAt,
      updatedAt: domainPersons[2].updatedAt,
    },
  ];

  it.each([
    [null, null],
    [databasePersons[0], domainPersons[0]],
    [databasePersons[1], domainPersons[1]],
    [databasePersons[2], domainPersons[2]],
  ])("should find a person by ID", async (databasePerson, domainPerson) => {
    jest.spyOn(prisma.person, "findUnique").mockResolvedValueOnce(databasePerson);

    const result = await repository.findById(domainPersons[0].id);

    expect(result).toEqual(domainPerson);
    expect(prisma.person.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.person.findUnique).toHaveBeenCalledWith({
      where: {
        id: domainPersons[0].id.toString(),
      },
    });
  });

  it("should delete an person by ID", async () => {
    jest.spyOn(prisma.person, "delete");

    await repository.delete(domainPersons[0].id);

    expect(prisma.person.delete).toHaveBeenCalledTimes(1);
    expect(prisma.person.delete).toHaveBeenCalledWith({
      where: {
        id: domainPersons[0].id.toString(),
      },
    });
  });
});
