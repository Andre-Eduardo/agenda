import {Module} from '@nestjs/common';
import {
    ClinicalDocumentController,
    DocumentTemplateController,
    PatientClinicalDocumentsController,
} from '@application/clinical-document/controllers';
import {PdfBuilderService} from '@application/clinical-document/pdf-builder/pdf-builder.service';
import {
    CancelDocumentService,
    CreateDraftService,
    GeneratePdfService,
    GetDocumentService,
    ListTemplatesService,
    SearchClinicalDocumentsService,
    UpsertTemplateService,
} from '@application/clinical-document/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicalDocumentController, PatientClinicalDocumentsController, DocumentTemplateController],
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
