import {Injectable} from '@nestjs/common';
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import type {FileStorage, UploadInfo} from '../../domain/@shared/storage/file-storage';
import {EnvConfigService} from '../config';

@Injectable()
export class S3FileStorage implements FileStorage {
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor(private readonly config: EnvConfigService) {
        const s3 = config.storage.s3;
        this.bucket = s3.bucket ?? '';
        this.client = new S3Client({
            region: s3.region,
            credentials:
                s3.accessKeyId && s3.secretAccessKey
                    ? {accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey}
                    : undefined,
        });
    }

    async prepareUpload(filePath: string, mimeType: string, _checksum?: string): Promise<UploadInfo> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
            ContentType: mimeType,
        });

        const url = await getSignedUrl(this.client, command, {expiresIn: 3600});

        return {url, method: 'PUT'};
    }

    async promote(tempPath: string, finalPath: string): Promise<void> {
        await this.client.send(
            new CopyObjectCommand({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${tempPath}`,
                Key: finalPath,
            })
        );

        await this.delete(tempPath);
    }

    async getFileInfo(filePath: string): Promise<{size: number; checksum: string} | null> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({Bucket: this.bucket, Key: filePath})
            );

            const size = response.ContentLength ?? 0;
            const checksum = response.ChecksumSHA256 ?? response.ETag?.replace(/"/g, '') ?? '';

            return {size, checksum};
        } catch {
            return null;
        }
    }

    async delete(filePath: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({Bucket: this.bucket, Key: filePath}));
    }

    async storeBuffer(filePath: string, buffer: Buffer, mimeType: string): Promise<string> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
                Body: buffer,
                ContentType: mimeType,
            }),
        );
        const region = this.config.storage.s3.region ?? 'us-east-1';
        return `https://${this.bucket}.s3.${region}.amazonaws.com/${filePath}`;
    }
}
