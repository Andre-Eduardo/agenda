import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { Email, Phone } from "@domain/@shared/value-objects";
import { ClinicRepository } from "@domain/clinic/clinic.repository";
import { EventDispatcher } from "@domain/event";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { ClinicDto, UpdateClinicDto } from "@application/clinic/dtos";

@Injectable()
export class UpdateClinicService implements ApplicationService<UpdateClinicDto, ClinicDto> {
  constructor(
    private readonly clinicRepository: ClinicRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<UpdateClinicDto>): Promise<ClinicDto> {
    const clinic = await this.clinicRepository.findById(actor.clinicId);

    if (clinic === null) {
      throw new ResourceNotFoundException("clinic.not_found", actor.clinicId.toString());
    }

    let phone: Phone | null | undefined;

    if (payload.phone === undefined) {
      phone = undefined;
    } else if (payload.phone === null) {
      phone = null;
    } else {
      phone = Phone.create(payload.phone);
    }

    let email: Email | null | undefined;

    if (payload.email === undefined) {
      email = undefined;
    } else if (payload.email === null) {
      email = null;
    } else {
      email = Email.create(payload.email);
    }

    clinic.change({
      name: payload.name,
      phone,
      email,
      street: payload.street,
      number: payload.number,
      complement: payload.complement,
      neighborhood: payload.neighborhood,
      city: payload.city,
      state: payload.state,
      zipCode: payload.zipCode,
      country: payload.country,
      logoUrl: payload.logoUrl,
      clinicSpecialties: payload.clinicSpecialties,
    });

    await this.clinicRepository.save(clinic);
    this.eventDispatcher.dispatch(actor, clinic);

    return new ClinicDto(clinic);
  }
}
