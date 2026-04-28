import {Entity, type AllEntityProps, type EntityJson} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';

export enum FilePromotionStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    READY = 'READY',
    FAILED = 'FAILED',
}

export class UploadFile extends Entity<UploadFileId> {
    tempPath: string;
    finalPath: string | null;
    status: FilePromotionStatus;
    promotionAttempts: number;
    mimeType: string;
    size: number;
    checksum: string | null;

    constructor(props: AllEntityProps<UploadFile>) {
        super(props);
        this.tempPath = props.tempPath;
        this.finalPath = props.finalPath;
        this.status = props.status;
        this.promotionAttempts = props.promotionAttempts;
        this.mimeType = props.mimeType;
        this.size = props.size;
        this.checksum = props.checksum;
    }

    static create(props: {tempPath: string; mimeType: string; size: number; checksum?: string}): UploadFile {
        const now = new Date();

        return new UploadFile({
            id: UploadFileId.generate(),
            tempPath: props.tempPath,
            finalPath: null,
            status: FilePromotionStatus.PENDING,
            promotionAttempts: 0,
            mimeType: props.mimeType,
            size: props.size,
            checksum: props.checksum ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    markInProgress(): void {
        this.status = FilePromotionStatus.IN_PROGRESS;
        this.update();
    }

    markReady(finalPath: string, size?: number, checksum?: string): void {
        this.status = FilePromotionStatus.READY;
        this.finalPath = finalPath;

        if (size !== undefined) this.size = size;

        if (checksum !== undefined) this.checksum = checksum;
        this.update();
    }

    markPending(): void {
        this.status = FilePromotionStatus.PENDING;
        this.update();
    }

    markFailed(): void {
        this.status = FilePromotionStatus.FAILED;
        this.update();
    }

    incrementAttempts(): void {
        this.promotionAttempts += 1;
        this.update();
    }

    toJSON(): EntityJson<UploadFile> {
        return {
            id: this.id.toJSON(),
            tempPath: this.tempPath,
            finalPath: this.finalPath,
            status: this.status,
            promotionAttempts: this.promotionAttempts,
            mimeType: this.mimeType,
            size: this.size,
            checksum: this.checksum,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class UploadFileId extends EntityId<'UploadFileId'> {
    static from(value: string): UploadFileId {
        return new UploadFileId(value);
    }

    static generate(): UploadFileId {
        return new UploadFileId();
    }
}
