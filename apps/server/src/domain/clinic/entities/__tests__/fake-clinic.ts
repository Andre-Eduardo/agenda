import { Clinic, ClinicId } from "../clinic.entity";

export function fakeClinic(payload: Partial<Clinic> = {}): Clinic {
  return new Clinic({
    id: ClinicId.generate(),
    name: "Clínica Teste",
    documentId: null,
    phone: null,
    email: null,
    isPersonalClinic: false,
    createdAt: new Date(1000),
    updatedAt: new Date(1000),
    ...payload,
  });
}
