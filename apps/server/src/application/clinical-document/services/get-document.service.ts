import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ClinicalDocumentId } from "@domain/clinical-document/entities";
import { ClinicalDocumentRepository } from "@domain/clinical-document/clinical-document.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { ClinicalDocumentDto } from "@application/clinical-document/dtos";

type GetDocumentDto = { documentId: ClinicalDocumentId };

@Injectable()
export class GetDocumentService implements ApplicationService<GetDocumentDto, ClinicalDocumentDto> {
  constructor(private readonly clinicalDocumentRepository: ClinicalDocumentRepository) {}

  async execute({ actor, payload }: Command<GetDocumentDto>): Promise<ClinicalDocumentDto> {
    const document = await this.clinicalDocumentRepository.findById(payload.documentId);

    if (!document || document.clinicId.toString() !== actor.clinicId.toString()) {
      throw new ResourceNotFoundException(
        "Clinical document not found.",
        payload.documentId.toString(),
      );
    }

    return new ClinicalDocumentDto(document);
  }
}
