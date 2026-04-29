import { Inject, Injectable } from "@nestjs/common";
import { uuidv7 } from "uuidv7";
import { EventDispatcher } from "@domain/event";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { FileStorage, FilePaths } from "@domain/@shared/storage/file-storage";
import { ClinicalDocumentId } from "@domain/clinical-document/entities";
import { ClinicalDocumentRepository } from "@domain/clinical-document/clinical-document.repository";
import { ClinicalDocumentTemplateRepository } from "@domain/clinical-document/clinical-document-template.repository";
import { ClinicRepository } from "@domain/clinic/clinic.repository";
import { ProfessionalRepository } from "@domain/professional/professional.repository";
import { ClinicMemberRepository } from "@domain/clinic-member/clinic-member.repository";
import { PatientRepository } from "@domain/patient/patient.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { PdfBuilderService } from "@application/clinical-document/pdf-builder/pdf-builder.service";
import type { PdfBuildContext } from "@application/clinical-document/pdf-builder/pdf-builder.service";
import { ClinicalDocumentDto } from "@application/clinical-document/dtos";

type GeneratePdfDto = { documentId: ClinicalDocumentId };

@Injectable()
export class GeneratePdfService implements ApplicationService<GeneratePdfDto, ClinicalDocumentDto> {
  constructor(
    private readonly clinicalDocumentRepository: ClinicalDocumentRepository,
    private readonly clinicalDocumentTemplateRepository: ClinicalDocumentTemplateRepository,
    private readonly clinicRepository: ClinicRepository,
    private readonly professionalRepository: ProfessionalRepository,
    private readonly clinicMemberRepository: ClinicMemberRepository,
    private readonly patientRepository: PatientRepository,
    @Inject(FileStorage) private readonly fileStorage: FileStorage,
    private readonly pdfBuilderService: PdfBuilderService,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<GeneratePdfDto>): Promise<ClinicalDocumentDto> {
    const document = await this.clinicalDocumentRepository.findById(payload.documentId);

    if (!document || document.clinicId.toString() !== actor.clinicId.toString()) {
      throw new ResourceNotFoundException(
        "Clinical document not found.",
        payload.documentId.toString(),
      );
    }

    const [template, clinic, professional, patient] = await Promise.all([
      this.clinicalDocumentTemplateRepository
        .findByClinicAndType(actor.clinicId, document.type)
        .then((t) => t ?? this.clinicalDocumentTemplateRepository.findDefaultByType(document.type)),
      this.clinicRepository.findById(actor.clinicId),
      this.professionalRepository.findById(document.responsibleProfessionalId),
      this.patientRepository.findById(document.patientId),
    ]);

    if (!clinic) {
      throw new ResourceNotFoundException("Clinic not found.", actor.clinicId.toString());
    }

    if (!professional) {
      throw new ResourceNotFoundException(
        "Professional not found.",
        document.responsibleProfessionalId.toString(),
      );
    }

    if (!patient) {
      throw new ResourceNotFoundException("Patient not found.", document.patientId.toString());
    }

    const clinicMember = await this.clinicMemberRepository.findById(professional.clinicMemberId);

    const clinicAddress = [clinic.street, clinic.number, clinic.city, clinic.state]
      .filter(Boolean)
      .join(", ");

    const ctx: PdfBuildContext = {
      clinic: {
        name: clinic.name,
        address: clinicAddress || undefined,
        phone: clinic.phone?.toString() ?? undefined,
        email: clinic.email?.toString() ?? undefined,
        logoUrl: clinic.logoUrl ?? undefined,
      },
      professional: {
        name: clinicMember?.displayName ?? professional.registrationNumber ?? "Profissional",
        registrationNumber: professional.registrationNumber ?? undefined,
        specialty: professional.specialty ?? undefined,
      },
      patient: {
        name: patient.name,
        documentId: patient.documentId?.toString() ?? undefined,
        birthDate: patient.birthDate?.toLocaleDateString("pt-BR") ?? undefined,
      },
      document,
      layoutJson: template?.layoutJson ?? {},
    };

    const buffer = await this.pdfBuilderService.generateBuffer(ctx);

    const fileId = uuidv7();
    const fileName = `${document.type.toLowerCase()}-${fileId}.pdf`;
    const filePath = FilePaths.final(fileName);
    const url = await this.fileStorage.storeBuffer(filePath, buffer, "application/pdf");

    document.markGenerated(fileId, template?.id ?? null);

    await this.clinicalDocumentRepository.saveWithGeneratedFile(document, {
      fileName,
      url,
      patientId: document.patientId,
      clinicId: document.clinicId,
      createdByMemberId: document.createdByMemberId,
      description: `Documento clínico: ${document.type}`,
    });

    this.eventDispatcher.dispatch(actor, document);

    return new ClinicalDocumentDto(document);
  }
}
