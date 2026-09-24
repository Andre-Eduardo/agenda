import {randomUUID} from 'node:crypto';
import {Injectable} from '@nestjs/common';
import {AuditLogRepository, NewAuditLogEntry} from '@domain/audit/audit-log.repository';
import {PrismaService} from '@infrastructure/repository/prisma/prisma.service';

@Injectable()
export class AuditLogPrismaRepository implements AuditLogRepository {
    constructor(private readonly prisma: PrismaService) {}

    async append(entry: NewAuditLogEntry): Promise<void> {
        await this.prisma.auditLog.create({data: {id: randomUUID(), ...entry}});
    }

    async search(clinicId: string, page: number, pageSize: number) {
        const where = {clinicId};
        const [data, totalCount] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where,
                orderBy: [{occurredAt: 'desc'}, {id: 'desc'}],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.auditLog.count({where}),
        ]);

        return {data: data.map((entry) => ({...entry, result: this.toResult(entry.result)})), totalCount};
    }

    private toResult(value: string): 'SUCCESS' | 'DENIED' | 'ERROR' {
        if (value === 'SUCCESS' || value === 'DENIED' || value === 'ERROR') {
            return value;
        }

        throw new Error(`Unknown audit result: ${value}`);
    }
}
