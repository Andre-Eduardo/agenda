import {
  AggregateRoot,
  type AllEntityProps,
  type CreateEntity,
  type EntityJson,
  type EntityProps,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import { InvalidInputException } from "@domain/@shared/exceptions";
import type { DocumentId, Email, Phone } from "@domain/@shared/value-objects";
import type { AiSpecialtyGroup } from "@domain/form-template/entities";
import { ClinicCreatedEvent, ClinicChangedEvent, ClinicDeletedEvent } from "@domain/clinic/events";

export type ClinicProps = EntityProps<Clinic>;
export type CreateClinic = CreateEntity<Clinic>;
export type UpdateClinic = Partial<ClinicProps>;

export class Clinic extends AggregateRoot<ClinicId> {
  name: string;
  documentId: DocumentId | null;
  phone: Phone | null;
  email: Email | null;
  /** true = autônomo usando o sistema sem clínica real. Front simplifica UI. */
  isPersonalClinic: boolean;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  logoUrl: string | null;
  clinicSpecialties: AiSpecialtyGroup[];

  constructor(props: AllEntityProps<Clinic>) {
    super(props);
    this.name = props.name;
    this.documentId = props.documentId ?? null;
    this.phone = props.phone ?? null;
    this.email = props.email ?? null;
    this.isPersonalClinic = props.isPersonalClinic;
    this.street = props.street ?? null;
    this.number = props.number ?? null;
    this.complement = props.complement ?? null;
    this.neighborhood = props.neighborhood ?? null;
    this.city = props.city ?? null;
    this.state = props.state ?? null;
    this.zipCode = props.zipCode ?? null;
    this.country = props.country ?? null;
    this.logoUrl = props.logoUrl ?? null;
    this.clinicSpecialties = props.clinicSpecialties ?? [];
    this.validate();
  }

  static create(props: CreateClinic): Clinic {
    const now = new Date();

    const clinic = new Clinic({
      ...props,
      id: ClinicId.generate(),
      name: props.name,
      documentId: props.documentId ?? null,
      phone: props.phone ?? null,
      email: props.email ?? null,
      isPersonalClinic: props.isPersonalClinic ?? false,
      street: props.street ?? null,
      number: props.number ?? null,
      complement: props.complement ?? null,
      neighborhood: props.neighborhood ?? null,
      city: props.city ?? null,
      state: props.state ?? null,
      zipCode: props.zipCode ?? null,
      country: props.country ?? null,
      logoUrl: props.logoUrl ?? null,
      clinicSpecialties: props.clinicSpecialties ?? [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    clinic.addEvent(new ClinicCreatedEvent({ clinic, timestamp: now }));

    return clinic;
  }

  change(props: UpdateClinic): void {
    const oldState = new Clinic(this);

    if (props.name !== undefined) this.name = props.name;

    if (props.documentId !== undefined) this.documentId = props.documentId;

    if (props.phone !== undefined) this.phone = props.phone;

    if (props.email !== undefined) this.email = props.email;

    if (props.street !== undefined) this.street = props.street;

    if (props.number !== undefined) this.number = props.number;

    if (props.complement !== undefined) this.complement = props.complement;

    if (props.neighborhood !== undefined) this.neighborhood = props.neighborhood;

    if (props.city !== undefined) this.city = props.city;

    if (props.state !== undefined) this.state = props.state;

    if (props.zipCode !== undefined) this.zipCode = props.zipCode;

    if (props.country !== undefined) this.country = props.country;

    if (props.logoUrl !== undefined) this.logoUrl = props.logoUrl;

    if (props.clinicSpecialties !== undefined) this.clinicSpecialties = props.clinicSpecialties;

    this.validate();
    this.addEvent(new ClinicChangedEvent({ oldState, newState: this }));
  }

  delete(): void {
    super.delete();
    this.addEvent(new ClinicDeletedEvent({ clinic: this }));
  }

  private validate(): void {
    if (this.name.length === 0) {
      throw new InvalidInputException("Clinic name must be at least 1 character long.");
    }
  }

  toJSON(): EntityJson<Clinic> {
    return {
      id: this.id.toJSON(),
      name: this.name,
      documentId: this.documentId?.toJSON() ?? null,
      phone: this.phone?.toJSON() ?? null,
      email: this.email?.toJSON() ?? null,
      isPersonalClinic: this.isPersonalClinic,
      street: this.street,
      number: this.number,
      complement: this.complement,
      neighborhood: this.neighborhood,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country,
      logoUrl: this.logoUrl,
      clinicSpecialties: this.clinicSpecialties,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }
}

export class ClinicId extends EntityId<"ClinicId"> {
  static from(value: string): ClinicId {
    return new ClinicId(value);
  }

  static generate(): ClinicId {
    return new ClinicId();
  }
}
