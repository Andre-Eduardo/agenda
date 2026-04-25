import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {
    ClinicalDocumentController,
    DocumentTemplateController,
    PatientClinicalDocumentsController,
} from './controllers';
import {PdfBuilderService} from './pdf-builder/pdf-builder.service';
import {
    CancelDocumentService,
    CreateDraftService,
    GeneratePdfService,
    GetDocumentService,
    ListTemplatesService,
    SearchClinicalDocumentsService,
    UpsertTemplateService,
} from './services';

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
