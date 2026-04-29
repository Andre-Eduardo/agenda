import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import {
  ClinicalDocumentController,
  DocumentTemplateController,
  PatientClinicalDocumentsController,
} from "@application/clinical-document/controllers";
import { PdfBuilderService } from "@application/clinical-document/pdf-builder/pdf-builder.service";
import {
  CancelDocumentService,
  CreateDraftService,
  GeneratePdfService,
  GetDocumentService,
  ListTemplatesService,
  SearchClinicalDocumentsService,
  UpsertTemplateService,
} from "@application/clinical-document/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [
    ClinicalDocumentController,
    PatientClinicalDocumentsController,
    DocumentTemplateController,
  ],
  providers: [
    PdfBuilderService,
    CreateDraftService,
    GeneratePdfService,
    GetDocumentService,
    CancelDocumentService,
    SearchClinicalDocumentsService,
    ListTemplatesService,
    UpsertTemplateService,
  ],
})
export class ClinicalDocumentModule {}
