import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ProfessionalRepository } from "@domain/professional/professional.repository";
import { EventDispatcher } from "@domain/event";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { ProfessionalDto, UpdateProfessionalDto } from "@application/professional/dtos";

@Injectable()
export class UpdateProfessionalService implements ApplicationService<
  UpdateProfessionalDto,
  ProfessionalDto
> {
  constructor(
    private readonly professionalRepository: ProfessionalRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({
    actor,
    payload: { id, ...props },
  }: Command<UpdateProfessionalDto>): Promise<ProfessionalDto> {
    const professional = await this.professionalRepository.findById(id);

    if (professional === null) {
      throw new ResourceNotFoundException("Professional not found.", id.toString());
    }

    professional.change(props);

    await this.professionalRepository.save(professional);

    this.eventDispatcher.dispatch(actor, professional);

    return new ProfessionalDto(professional);
  }
}
