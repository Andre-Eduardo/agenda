import {S3Client} from '@aws-sdk/client-s3';
import {ConfigService} from '@nestjs/config';
import {EnvConfigService} from '@infrastructure/config';
import {S3FileStorage} from '../s3-file.storage';

type S3Options = {
    endpoint?: string;
    forcePathStyle?: boolean;
    region?: string;
};

function createStorage(s3: S3Options): S3FileStorage {
    const config = new EnvConfigService(
        new ConfigService({
            storage: {
                s3: {bucket: 'clinic-files', ...s3},
            },
        })
    );

    return new S3FileStorage(config);
}

describe('An S3 file storage', () => {
    beforeEach(() => {
        jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return an AWS URL when no custom endpoint is configured', async () => {
        const storage = createStorage({region: 'sa-east-1'});

        await expect(storage.storeBuffer('files/a.pdf', Buffer.from('a'), 'application/pdf')).resolves.toBe(
            'https://clinic-files.s3.sa-east-1.amazonaws.com/files/a.pdf'
        );
    });

    it('should return a path-style URL for S3-compatible endpoints', async () => {
        const storage = createStorage({endpoint: 'http://minio:9000/', forcePathStyle: true});

        await expect(storage.storeBuffer('files/a.pdf', Buffer.from('a'), 'application/pdf')).resolves.toBe(
            'http://minio:9000/clinic-files/files/a.pdf'
        );
    });

    it('should return a virtual-hosted URL for custom endpoints without path style', async () => {
        const storage = createStorage({endpoint: 'https://nyc3.digitaloceanspaces.com'});

        await expect(storage.storeBuffer('files/a.pdf', Buffer.from('a'), 'application/pdf')).resolves.toBe(
            'https://clinic-files.nyc3.digitaloceanspaces.com/files/a.pdf'
        );
    });
});
