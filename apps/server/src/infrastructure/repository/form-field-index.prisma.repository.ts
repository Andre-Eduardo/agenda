import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Prisma} from '@prisma/client';
import {FormFieldIndex, FormFieldIndexId} from '../../domain/form-field-index/entities';
import {FormFieldIndexRepository, FormFieldIndexFilter} from '../../domain/form-field-index/form-field-index.repository';
import {PatientFormId} from '../../domain/patient-form/entities';
import {toEnumOrNull} from '../../domain/@shared/utils';
import {FormFieldIndexMapper} from '../mappers/form-field-index.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class FormFieldIndexPrismaRepository extends PrismaRepository implements FormFieldIndexRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: FormFieldIndexMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: FormFieldIndexId): Promise<FormFieldIndex | null> {
        const record = await this.prisma.formFieldIndex.findUnique({
            where: {id: id.toString()},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByPatientFormAndField(
        patientFormId: PatientFormId,
        fieldId: string
    ): Promise<FormFieldIndex | null> {
        const record = await this.prisma.formFieldIndex.findFirst({
            where: {
                patientFormId: patientFormId.toString(),
                fieldId,
            },
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async listByPatientForm(patientFormId: PatientFormId): Promise<FormFieldIndex[]> {
        const records = await this.prisma.formFieldIndex.findMany({
            where: {patientFormId: patientFormId.toString()},
        });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async search(filter: FormFieldIndexFilter): Promise<FormFieldIndex[]> {
        const where: PrismaClient.Prisma.FormFieldIndexWhereInput = {
            patientFormId: filter.patientFormId?.toString(),
            fieldId: filter.fieldId,
            specialtyGroup: toEnumOrNull(PrismaClient.AiSpecialtyGroup, filter.specialtyGroup) ?? undefined,
        };

        const records = await this.prisma.formFieldIndex.findMany({where, orderBy: {createdAt: 'desc'}});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async saveMany(entries: FormFieldIndex[]): Promise<void> {
        if (entries.length === 0) return;

        const data = entries.map((e) => this.mapper.toPersistence(e));

        await this.prisma.$transaction(
            data.map((d) => {
                const valueJson = d.valueJson ?? Prisma.JsonNull;
                const createData = {
                    ...d,
                    valueJson,
                } satisfies Prisma.FormFieldIndexUncheckedCreateInput;
                return this.prisma.formFieldIndex.upsert({
                    where: {
                        form_field_index_unique: {
                            patientFormId: d.patientFormId,
                            fieldId: d.fieldId,
                        },
                    },
                    create: createData,
                    update: {
                        fieldLabel: d.fieldLabel,
                        fieldType: d.fieldType,
                        valueText: d.valueText,
                        valueNumber: d.valueNumber,
                        valueBoolean: d.valueBoolean,
                        valueDate: d.valueDate,
                        valueJson,
                        confidence: d.confidence,
                        updatedAt: d.updatedAt,
                    },
                });
            })
        );
    }

    async deleteByPatientForm(patientFormId: PatientFormId): Promise<void> {
        await this.prisma.formFieldIndex.deleteMany({
            where: {patientFormId: patientFormId.toString()},
        });
    }
}
