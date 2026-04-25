import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {Injectable} from '@nestjs/common';
import type {FileStorage, UploadInfo} from '../../domain/@shared/storage/file-storage';
import {EnvConfigService} from '../config';

@Injectable()
export class LocalFileStorage implements FileStorage {
    constructor(private readonly config: EnvConfigService) {}

    async prepareUpload(_path: string, _mimeType: string, _checksum?: string): Promise<UploadInfo | null> {
        return null;
    }

    async promote(tempPath: string, finalPath: string): Promise<void> {
        const src = this.resolvePath(tempPath);
        const dest = this.resolvePath(finalPath);
        fs.mkdirSync(path.dirname(dest), {recursive: true});
        fs.renameSync(src, dest);
    }

    async getFileInfo(filePath: string): Promise<{size: number; checksum: string} | null> {
        const resolved = this.resolvePath(filePath);
        try {
            const stat = fs.statSync(resolved);
            const buffer = fs.readFileSync(resolved);
            const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
            return {size: stat.size, checksum};
        } catch {
            return null;
        }
    }

    async delete(filePath: string): Promise<void> {
        const resolved = this.resolvePath(filePath);
        try {
            fs.unlinkSync(resolved);
        } catch {
            // Ignore if file doesn't exist
        }
    }

    async storeBuffer(filePath: string, buffer: Buffer, _mimeType: string): Promise<string> {
        const resolved = this.resolvePath(filePath);
        fs.mkdirSync(path.dirname(resolved), {recursive: true});
        fs.writeFileSync(resolved, buffer);
        return `${this.config.storage.publicBaseUrl}/uploads/${filePath}`;
    }

    private resolvePath(filePath: string): string {
        return path.join(this.config.storage.localUploadDir, filePath);
    }
}
