import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { FormTemplateController } from "@application/form-template/controllers/form-template.controller";
import {
  CreateFormTemplateService,
  GetFormTemplateService,
  SearchFormTemplatesService,
  CloneFormTemplateService,
  DeleteFormTemplateService,
  CreateFormTemplateVersionService,
  PublishFormTemplateVersionService,
  DeprecateFormTemplateVersionService,
  ListFormTemplateVersionsService,
} from "@application/form-template/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [FormTemplateController],
  providers: [
    CreateFormTemplateService,
    GetFormTemplateService,
    SearchFormTemplatesService,
    CloneFormTemplateService,
    DeleteFormTemplateService,
    CreateFormTemplateVersionService,
    PublishFormTemplateVersionService,
    DeprecateFormTemplateVersionService,
    ListFormTemplateVersionsService,
  ],
})
export class FormTemplateModule {}
