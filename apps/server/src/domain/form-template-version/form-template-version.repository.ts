import type {FormTemplateId} from '../form-template/entities';
import type {FormTemplateVersion, FormTemplateVersionId} from './entities';

export interface FormTemplateVersionRepository {
    findById(id: FormTemplateVersionId): Promise<FormTemplateVersion | null>;
    findByTemplateAndVersion(templateId: FormTemplateId, versionNumber: number): Promise<FormTemplateVersion | null>;
    findLatestPublished(templateId: FormTemplateId): Promise<FormTemplateVersion | null>;
    findNextVersionNumber(templateId: FormTemplateId): Promise<number>;
    listByTemplate(templateId: FormTemplateId): Promise<FormTemplateVersion[]>;
    save(version: FormTemplateVersion): Promise<void>;
}

export abstract class FormTemplateVersionRepository {}
