import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { PatientRepository } from "@domain/patient/patient.repository";
import { EventDispatcher } from "@domain/event";
import { ApplicationService, Command } from "@application/@shared/application.service";
import type { UpdatePatientDto } from "@application/patient/dtos";
import { PatientDto } from "@application/patient/dtos";

type AddressInput =
  | {
      street?: string | null;
      number?: string | null;
      complement?: string | null;
      neighborhood?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      country?: string | null;
    }
  | null
  | undefined;

function resolveAddress(address: AddressInput):
  | {
      street: string | null;
      number: string | null;
      complement: string | null;
      neighborhood: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
      country: string | null;
    }
  | null
  | undefined {
  if (address === undefined) return undefined;

  if (!address) return null;

  return {
    street: address.street ?? null,
    number: address.number ?? null,
    complement: address.complement ?? null,
    neighborhood: address.neighborhood ?? null,
    city: address.city ?? null,
    state: address.state ?? null,
    zipCode: address.zipCode ?? null,
    country: address.country ?? null,
  };
}

@Injectable()
export class UpdatePatientService implements ApplicationService<UpdatePatientDto, PatientDto> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({
    actor,
    payload: { id, ...props },
  }: Command<UpdatePatientDto>): Promise<PatientDto> {
    const patient = await this.patientRepository.findById(id);

    if (patient === null) {
      throw new ResourceNotFoundException("Patient not found.", id.toString());
    }

    patient.change({
      name: props.name,
      phone: props.phone ?? undefined,
      gender: props.gender ?? undefined,
      birthDate: props.birthDate ?? undefined,
      email: props.email ?? undefined,
      emergencyContactName: props.emergencyContactName ?? undefined,
      emergencyContactPhone: props.emergencyContactPhone ?? undefined,
      address: resolveAddress(props.address),
      insurancePlanId:
        props.insurancePlanId !== undefined ? (props.insurancePlanId ?? null) : undefined,
      insuranceCardNumber:
        props.insuranceCardNumber !== undefined ? (props.insuranceCardNumber ?? null) : undefined,
      insuranceValidUntil:
        props.insuranceValidUntil !== undefined ? (props.insuranceValidUntil ?? null) : undefined,
    });

    await this.patientRepository.save(patient);

    this.eventDispatcher.dispatch(actor, patient);

    return new PatientDto(patient);
  }
}
