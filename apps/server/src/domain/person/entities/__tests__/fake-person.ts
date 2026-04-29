import { DocumentId, Phone } from "../../../@shared/value-objects";
import { CompanyId } from "../../../company/entities";
import { Person, PersonId, PersonType } from "../index";

export function fakePerson(payload: Partial<Person> = {}): Person {
  return new Person({
    id: PersonId.generate(),
    companyId: CompanyId.generate(),
    name: "John Doe",
    documentId: DocumentId.create("12345678909"),
    profiles: new Set(),
    personType: PersonType.NATURAL,
    phone: Phone.create("5511999999999"),
    gender: null,
    createdAt: new Date(1000),
    updatedAt: new Date(1000),
    ...payload,
  });
}
