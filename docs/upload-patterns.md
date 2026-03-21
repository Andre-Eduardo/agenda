# Upload Patterns

How file uploads work end-to-end, including the two upload strategies, file promotion lifecycle, and storage abstraction.

## Overview

The upload system supports two strategies:

1. **S3 presigned URL** — client uploads directly to S3; server only generates the presigned URL
2. **Local multipart** — client uploads to the server; server stores locally (dev / on-premise use)

Both strategies use the same **promotion** flow to finalize files after upload.

## Upload Flow (High-Level)

```
Client                          Server                          Storage (local/S3)
  |                               |                               |
  |--- POST /upload/prepare ----→ |                               |
  |    {filename, mimeType,       |--- Validate MIME + size       |
  |     size, checksum?}          |--- Generate temp path         |
  |                               |--- prepareUpload()  --------→ |
  |                               |←--- presigned URL             |
  |←--- {storageType, tempPath,   |                               |
  |      upload: {url, fields}}   |                               |
  |                               |                               |
  |--- PUT [presigned URL] -----→ |                             → S3 (direct)
  |  OR                           |                               |
  |--- POST /upload/local ------→ |--- FileValidationPipe         |
  |    multipart/form-data        |--- Store temp file  --------→ local
  |←--- {tempPath}                |                               |
  |                               |                               |
  | [Attach tempPath to entity]   |                               |
  |--- POST /entities  ---------→ |--- Create entity with         |
  |    {tempPath, ...}            |    tempPath reference         |
  |                               |--- Save entity                |
  |                               |--- Publish FileUploadedEvent  |
  |                               |                               |
  |                  [Background] |--- FilePromotionListener      |
  |                               |--- Move temp → final path --→ |
  |                               |--- Mark file as READY         |
```

## Module Structure

```
application/upload/
├── upload.module.ts
├── config/
│   ├── upload-config.service.ts       # Multer configuration
│   └── serve-static-config.service.ts # Static file serving (local only)
├── controllers/
│   └── upload.controller.ts
├── dtos/
│   ├── prepare-upload.dto.ts          # Input: metadata before upload
│   ├── prepared-upload.dto.ts         # Output: upload instructions + presigned URL
│   ├── upload-local.dto.ts            # Input: multipart form body
│   └── temp-upload.dto.ts             # Output: temp path after local upload
├── pipes/
│   └── file-validation.pipe.ts        # Validates file MIME + size
├── services/
│   ├── prepare-upload.service.ts      # Step 1: generate upload instructions
│   ├── promote-file.service.ts        # Step 3: move temp → final
│   └── sync-file-attachment.service.ts # Helper: sync entity↔file link
├── listeners/
│   └── file-promotion.listener.ts     # Triggered by FileUploadedEvent
└── schedules/
    ├── file-promotion.job.ts          # Retry failed/pending promotions
    └── temp-cleanup.job.ts            # Delete orphaned temp files
```

## Step 1: PrepareUploadService

Called before the file is uploaded. Returns upload instructions.

```typescript
@Injectable()
export class PrepareUploadService extends BaseApplicationService<PrepareUploadDto, PreparedUploadDto> {
    async handle({payload}: Command<PrepareUploadDto>): Promise<PreparedUploadDto> {
        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(payload.mimeType)) {
            throw new InvalidInputException(UploadExceptions.unsupported_file_type, {mimeType: payload.mimeType});
        }

        // Validate size
        if (payload.size > this.config.storage.uploadFileMaxSize) {
            throw new InvalidInputException(UploadExceptions.file_size_exceeded, {
                maxSize: bytesToMb(this.config.storage.uploadFileMaxSize),
            });
        }

        // Generate unique temp path
        const ext = path.extname(payload.filename).toLowerCase();
        const tempPath = FilePaths.temp(payload.companyId, `${uuidv7()}${ext}`);

        // Get upload instructions from storage adapter
        const upload = await this.fileStorage.prepareUpload(tempPath, payload.mimeType, payload.checksum);

        return {
            storageType: this.config.storage.type,
            tempPath,
            upload,  // null for local, {url, fields} for S3
        };
    }
}
```

Input DTO:
```typescript
export const prepareUploadSchema = z.object({
    companyId: entityId(CompanyId),
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.coerce.number().positive(),
    checksum: z.string().optional(),  // SHA-256 for integrity check
});
```

Output DTO:
```typescript
export class PreparedUploadDto {
    storageType!: FileStorageType;       // 'local' | 's3'
    tempPath!: string;                    // Where file will be stored temporarily
    upload!: UploadInfo | null;          // Presigned URL info (S3) or null (local)
}

// UploadInfo for S3:
export class UploadInfo {
    url!: string;                        // PUT URL
    fields?: Record<string, string>;     // Additional form fields for multipart
    method!: 'PUT' | 'POST';
}
```

## Step 2: Local Upload Endpoint

For local storage only. Uses Multer for multipart/form-data.

```typescript
@Post('local')
@UseInterceptors(FileInterceptor('file'))
@HttpCode(HttpStatus.OK)
uploadLocal(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body() payload: UploadLocalDto,
): TempUploadDto {
    return {tempPath: payload.tempPath};
}
```

The `FileInterceptor` from `@nestjs/platform-express` stores the file using Multer. The `FileValidationPipe` validates MIME type and size.

### FileValidationPipe

```typescript
@Injectable()
export class FileValidationPipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
    transform(file: Express.Multer.File): Express.Multer.File {
        if (!file) {
            throw new InvalidInputException(UploadExceptions.no_file_uploaded);
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new InvalidInputException(UploadExceptions.unsupported_file_type, {mimeType: file.mimetype});
        }
        if (file.size > this.config.storage.uploadFileMaxSize) {
            throw new InvalidInputException(UploadExceptions.file_size_exceeded, {
                maxSize: bytesToMb(this.config.storage.uploadFileMaxSize),
            });
        }
        return file;
    }
}

// Applied inline on the param:
@UploadedFile(FileValidationPipe) file: Express.Multer.File
```

### Multer Configuration

```typescript
@Injectable()
export class UploadConfigService implements MulterOptionsFactory {
    createMulterOptions(): MulterModuleOptions {
        return {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const tempDir = path.join(this.config.storage.localUploadDir, 'temp');
                    fs.mkdirSync(tempDir, {recursive: true});
                    cb(null, tempDir);
                },
                filename: (req, file, cb) => {
                    // Use the tempPath provided in the request body
                    const tempPath = req.body.tempPath;
                    cb(null, path.basename(tempPath));
                },
            }),
            limits: {fileSize: this.config.storage.uploadFileMaxSize},
        };
    }
}
```

## Step 3: File Promotion

After the file is uploaded and attached to an entity, it must be **promoted** from the temp location to its final permanent path.

### Promotion Trigger (Event Listener)

```typescript
@Injectable()
export class FilePromotionListener {
    @OnEvents(FileUploadedEvent)
    async handle(actor: Actor, event: FileUploadedEvent): Promise<void> {
        await this.promoteFileService.execute({
            actor,
            payload: {fileId: event.file.id},
        });
    }
}
```

### PromoteFileService

```typescript
@Injectable()
export class PromoteFileService extends BaseApplicationService<PromoteFileDto> {
    private static readonly MAX_PROMOTION_ATTEMPTS = 5;

    async handle({payload}: Command<PromoteFileDto>): Promise<void> {
        const file = await this.fileRepository.findById(payload.fileId);
        if (!file) return; // Already cleaned up or not found

        // Skip if already processed
        if (file.status === FilePromotionStatus.READY || file.status === FilePromotionStatus.FAILED) return;

        // Generate final path
        const ext = path.extname(file.tempPath);
        const finalPath = FilePaths.final(file.companyId, `${file.id}${ext}`);

        try {
            file.markInProgress();
            await this.fileRepository.save(file);

            // Move file from temp to final location
            await this.fileStorage.promote(file.tempPath, finalPath);

            // Get metadata
            const info = await this.fileStorage.getFileInfo(finalPath);

            file.markReady(finalPath, info?.size, info?.checksum);
            await this.fileRepository.save(file);
        } catch (error) {
            file.incrementAttempts();
            if (file.promotionAttempts >= PromoteFileService.MAX_PROMOTION_ATTEMPTS) {
                file.markFailed();
                this.logger.error('File promotion failed permanently', error);
            } else {
                file.markPending();
                this.logger.warn('File promotion failed, will retry', {attempts: file.promotionAttempts});
            }
            await this.fileRepository.save(file);
        }
    }
}
```

### File Path Conventions

```typescript
export const FilePaths = {
    temp: (companyId: CompanyId, filename: string) =>
        `companies/${companyId}/temp/${filename}`,

    final: (companyId: CompanyId, filename: string) =>
        `companies/${companyId}/files/${filename}`,
};
```

The final filename uses the file entity's own ID plus the original extension.

## File Promotion Status Lifecycle

```
                    ┌─────────────────────────────────┐
                    │                                 │
   upload ──→ PENDING ──→ IN_PROGRESS ──→ READY       │
                 ↑              │                     │
                 │         (error, < max attempts)    │
                 └─────────────┘                     │
                                                     │
              (error, max attempts reached)          │
                           ──→ FAILED ───────────────┘
```

```typescript
enum FilePromotionStatus {
    PENDING = 'PENDING',         // Awaiting promotion (initial state)
    IN_PROGRESS = 'IN_PROGRESS', // Currently promoting
    READY = 'READY',             // Successfully promoted to final location
    FAILED = 'FAILED',           // Permanently failed after max retries
}
```

## Retry: FilePromotionJob

Runs on a cron schedule to retry all PENDING files (handles cases where the event listener failed):

```typescript
@Injectable()
export class FilePromotionJob {
    @Cron(CronExpression.EVERY_MINUTE)
    async handle(): Promise<void> {
        const pendingFiles = await this.fileRepository.findPending();
        for (const file of pendingFiles) {
            await this.promoteFileService.execute({
                actor: systemActor,
                payload: {fileId: file.id},
            });
        }
    }
}
```

## Cleanup: TempCleanupJob

Deletes temp files older than a configured threshold:

```typescript
@Injectable()
export class TempCleanupJob {
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handle(): Promise<void> {
        const cutoff = subHours(new Date(), this.config.storage.tempFileMaxAgeHours);
        const oldTempFiles = await this.fileRepository.findOldTemp(cutoff);
        for (const file of oldTempFiles) {
            await this.fileStorage.delete(file.tempPath);
            await this.fileRepository.delete(file);
        }
    }
}
```

## Storage Abstraction (FileStorage Interface)

```typescript
// domain/@shared/storage/file-storage.ts
export interface FileStorage {
    // Prepare presigned URL or local endpoint for upload
    prepareUpload(path: string, mimeType: string, checksum?: string): Promise<UploadInfo | null>;

    // Move file from temp to final location
    promote(tempPath: string, finalPath: string): Promise<void>;

    // Get metadata of stored file
    getFileInfo(path: string): Promise<{size: number; checksum: string} | null>;

    // Delete a file
    delete(path: string): Promise<void>;
}

// Injected as:
export const FileStorage = Symbol('FileStorage');
```

Two implementations:

| Implementation | Strategy | Notes |
|---------------|----------|-------|
| `LocalFileStorage` | `Node.js fs` | Dev + on-premise; files served via static middleware |
| `S3FileStorage` | AWS SDK + presigned URLs | Production; files served directly from S3 |

## Allowed MIME Types

```typescript
export const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'text/plain', 'text/csv',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm',
    // Video
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
];
```

## Configuration

```typescript
storage: {
    type: FileStorageType;          // 'local' | 's3'
    uploadFileMaxSize: number;      // Bytes; default: 5 * 1024 * 1024 (5MB)
    localUploadDir: string;         // Path for local storage; default: './uploads'
    publicBaseUrl: string;          // Base URL for serving local files
    tempFileMaxAgeHours: number;    // How long to keep orphaned temp files
    s3: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
}
```

## Static File Serving (Local Only)

When using local storage, files are served via `@nestjs/serve-static`:

```typescript
@Injectable()
export class ServeStaticConfigService implements ServeStaticModuleOptionsFactory {
    createLoggerOptions(): ServeStaticModuleOptions[] {
        return [{
            rootPath: this.config.storage.localUploadDir,
            serveRoot: '/uploads',   // Files accessible at /uploads/...
            exclude: ['/api/(.*)'],  // Don't intercept API routes
        }];
    }
}
```

## Attaching Files to Entities

When an entity references a file, it stores the `tempPath` initially. On creation, a `FileUploadedEvent` is raised which triggers promotion. After promotion, the entity should update its `filePath` reference via `SyncFileAttachmentService`:

```typescript
@Injectable()
export class SyncFileAttachmentService {
    // Listens for FileReadyEvent (after promotion) and updates entity filePath
    @OnEvents(FileReadyEvent)
    async handle(actor: Actor, event: FileReadyEvent): Promise<void> {
        // Find all entities referencing this file's tempPath
        // Update them to point to the final promoted path
    }
}
```

This decouples the entity creation from the upload completion.
