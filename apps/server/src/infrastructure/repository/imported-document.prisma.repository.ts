import {Injectable} from '@nestjs/common';
import {ImportedDocument, ImportedDocumentId} from '../../domain/record/entities/imported-document.entity';
import {ImportedDocumentRepository} from '../../domain/record/imported-document.repository';
import {ImportedDocumentMapper} from '../mappers/imported-document.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class ImportedDocumentPrismaRepository extends PrismaRepository implements ImportedDocumentRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ImportedDocumentMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: ImportedDocumentId): Promise<ImportedDocument | null> {
        const model = await this.prisma.importedDocument.findUnique({
            where: {id: id.toString()},
        });
        return model === null ? null : this.mapper.toDomain(model);
    }

    async save(document: ImportedDocument): Promise<void> {
        const data = this.mapper.toPersistence(document);
        await this.prisma.importedDocument.update({
            where: {id: data.id},
            data,
        });
    }
}
