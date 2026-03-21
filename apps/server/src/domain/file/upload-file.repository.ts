import type {UploadFile, UploadFileId} from './entities';

export abstract class UploadFileRepository {
    abstract findById(id: UploadFileId): Promise<UploadFile | null>;
    abstract findPending(): Promise<UploadFile[]>;
    abstract findOldTemp(before: Date): Promise<UploadFile[]>;
    abstract save(file: UploadFile): Promise<void>;
    abstract delete(file: UploadFile): Promise<void>;
}
