import {Injectable} from '@nestjs/common';
import {createHash} from 'crypto';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {RecordRepository} from '../../../domain/record/record.repository';
import {ClinicalProfileRepository} from '../../../domain/clinical-profile/clinical-profile.repository';
import {PatientAlertRepository} from '../../../domain/patient-alert/patient-alert.repository';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {FormFieldIndexRepository} from '../../../domain/form-field-index/form-field-index.repository';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';
import {
    PatientContextSnapshot,
    type PatientFacts,
    type CriticalContextEntry,
    type TimelineEntry,
    ContextSnapshotStatus,
} from '../../../domain/clinical-chat/entities';
import type {Patient} from '../../../domain/patient/entities';
import type {ClinicalProfile} from '../../../domain/clinical-profile/entities';
import type {Record as ClinicalRecord} from '../../../domain/record/entities';
import type {PatientForm} from '../../../domain/patient-form/entities';
import {FormResponseStatus} from '../../../domain/patient-form/entities';
import type {PatientAlert} from '../../../domain/patient-alert/entities';
import {AlertSeverity} from '../../../domain/patient-alert/entities';

export type BuildPatientContextInput = {
    patientId: PatientId;
    /** null = contexto genérico sem perspectiva profissional */
    professionalId?: ProfessionalId | null;
    /** Número máximo de records a incluir na timeline (padrão: 20) */
    maxRecords?: number;
    /** Número máximo de formulários a incluir (padrão: 10) */
    maxForms?: number;
};

export type PatientContextOutput = {
    patientFacts: PatientFacts;
    criticalContext: CriticalContextEntry[];
    timeline: TimelineEntry[];
    /** Records completos mais recentes para fonte de chunks */
    recentRecords: Array<{
        id: string;
        title: string | null;
        attendanceType: string | null;
        clinicalStatus: string | null;
        conductTags: string[];
        subjective: string | null;
        objective: string | null;
        assessment: string | null;
        plan: string | null;
        freeNotes: string | null;
        description: string | null;
        eventDate: string | null;
        templateType: string | null;
    }>;
    /** Formulários relevantes para fonte de chunks */
    relevantForms: Array<{
        id: string;
        templateCode: string;
        specialty: string | null;
        status: string;
        appliedAt: string;
        completedAt: string | null;
        indexedFields: Array<{
            fieldLabel: string | null;
            value: unknown;
        }>;
    }>;
    /** Hash de conteúdo para detectar staleness */
    contentHash: string;
    generatedAt: string;
};

/**
 * Serviço responsável por montar o contexto clínico completo de um paciente.
 *
 * Este serviço agrega dados de múltiplas fontes, organiza em estrutura utilizável por IA
 * e persiste um snapshot para reutilização futura.
 *
 * PONTO DE INTEGRAÇÃO FUTURA:
 * - O `patientFacts` + `criticalContext` + `timeline` serão usados para montar o system prompt
 * - Os `recentRecords` + `relevantForms` serão as fontes para chunking e RAG
 */
@Injectable()
export class BuildPatientContextService {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly recordRepository: RecordRepository,
        private readonly clinicalProfileRepository: ClinicalProfileRepository,
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly patientFormRepository: PatientFormRepository,
        private readonly formFieldIndexRepository: FormFieldIndexRepository,
        private readonly snapshotRepository: PatientContextSnapshotRepository
    ) {}

    async execute(input: BuildPatientContextInput): Promise<PatientContextOutput> {
        const {patientId, professionalId = null, maxRecords = 20, maxForms = 10} = input;

        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', patientId.toString());
        }

        // Buscar dados em paralelo para performance
        const [clinicalProfile, activeAlerts, recentRecordsResult, recentFormsResult] = await Promise.all([
            this.clinicalProfileRepository.findByPatientId(patientId),
            this.patientAlertRepository.search({limit: 50}, {patientId, isActive: true}),
            this.recordRepository.search(
                {limit: maxRecords, sort: [{key: 'eventDate', direction: 'desc'}]},
                {patientId}
            ),
            this.patientFormRepository.search(
                {limit: maxForms, sort: [{key: 'appliedAt', direction: 'desc'}]},
                {patientId, status: FormResponseStatus.COMPLETED}
            ),
        ]);

        // Montar facts estruturados do paciente
        const patientFacts = this.buildPatientFacts(patient, clinicalProfile);

        // Montar contexto crítico (alertas e alergias)
        const criticalContext = this.buildCriticalContext(activeAlerts.data, clinicalProfile);

        // Montar timeline com records e formulários
        const timeline = this.buildTimeline(recentRecordsResult.data, recentFormsResult.data);

        // Montar records recentes para chunking
        const recentRecords = this.mapRecordsForChunking(recentRecordsResult.data);

        // Montar formulários relevantes para chunking
        const relevantForms = await this.mapFormsForChunking(recentFormsResult.data);

        // Gerar hash de conteúdo para detectar staleness
        const contentHash = this.computeContentHash({
            patientFacts,
            criticalContext,
            recordIds: recentRecordsResult.data.map((r) => r.id.toString()),
            formIds: recentFormsResult.data.map((f) => f.id.toString()),
        });

        const output: PatientContextOutput = {
            patientFacts,
            criticalContext,
            timeline,
            recentRecords,
            relevantForms,
            contentHash,
            generatedAt: new Date().toISOString(),
        };

        // Persistir ou atualizar snapshot
        await this.persistSnapshot(patientId, professionalId, output, contentHash);

        return output;
    }

    private buildPatientFacts(
        patient: Patient,
        clinicalProfile: ClinicalProfile | null
    ): PatientFacts {
        const age = patient.birthDate ? this.calculateAge(patient.birthDate) : null;

        return {
            name: patient.name,
            birthDate: patient.birthDate?.toISOString().split('T')[0] ?? null,
            age,
            gender: patient.gender ?? null,
            documentId: patient.documentId.toString(),
            allergies: clinicalProfile?.allergies ?? null,
            chronicConditions: clinicalProfile?.chronicConditions ?? null,
            currentMedications: clinicalProfile?.currentMedications ?? null,
            surgicalHistory: clinicalProfile?.surgicalHistory ?? null,
            familyHistory: clinicalProfile?.familyHistory ?? null,
            socialHistory: clinicalProfile?.socialHistory ?? null,
            generalNotes: clinicalProfile?.generalNotes ?? null,
        };
    }

    private buildCriticalContext(
        alerts: PatientAlert[],
        clinicalProfile: ClinicalProfile | null
    ): CriticalContextEntry[] {
        const entries: CriticalContextEntry[] = [];

        // Alertas de alta e média severidade primeiro
        for (const alert of alerts) {
            if (alert.severity === AlertSeverity.HIGH || alert.severity === AlertSeverity.MEDIUM) {
                entries.push({
                    type: 'ALERT',
                    severity: alert.severity,
                    title: alert.title,
                    description: alert.description ?? null,
                });
            }
        }

        // Alergias do perfil clínico como entrada crítica
        if (clinicalProfile?.allergies) {
            entries.push({
                type: 'ALLERGY',
                severity: AlertSeverity.HIGH,
                title: 'Alergias conhecidas',
                description: clinicalProfile.allergies,
            });
        }

        return entries;
    }

    private buildTimeline(records: ClinicalRecord[], forms: PatientForm[]): TimelineEntry[] {
        const entries: TimelineEntry[] = [];

        for (const record of records) {
            entries.push({
                date: (record.eventDate ?? record.createdAt).toISOString(),
                type: 'RECORD',
                title: record.title ?? record.attendanceType ?? 'Evolução clínica',
                summary: record.assessment ?? record.description ?? record.freeNotes ?? null,
                sourceId: record.id.toString(),
                sourceType: 'RECORD',
            });
        }

        for (const form of forms) {
            entries.push({
                date: form.appliedAt.toISOString(),
                type: 'PATIENT_FORM',
                title: form.templateId.toString(),
                summary: `Formulário aplicado em ${form.appliedAt.toISOString().split('T')[0]}`,
                sourceId: form.id.toString(),
                sourceType: 'PATIENT_FORM',
            });
        }

        // Ordenar cronologicamente (mais recente primeiro)
        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    private mapRecordsForChunking(records: ClinicalRecord[]): PatientContextOutput['recentRecords'] {
        return records.map((r) => ({
            id: r.id.toString(),
            title: r.title,
            attendanceType: r.attendanceType,
            clinicalStatus: r.clinicalStatus,
            conductTags: r.conductTags,
            subjective: r.subjective,
            objective: r.objective,
            assessment: r.assessment,
            plan: r.plan,
            freeNotes: r.freeNotes,
            description: r.description,
            eventDate: r.eventDate?.toISOString() ?? null,
            templateType: r.templateType,
        }));
    }

    private async mapFormsForChunking(forms: PatientForm[]): Promise<PatientContextOutput['relevantForms']> {
        const result: PatientContextOutput['relevantForms'] = [];

        for (const form of forms) {
            const indexedFields = await this.formFieldIndexRepository.listByPatientForm(form.id);
            result.push({
                id: form.id.toString(),
                templateCode: form.templateId.toString(),
                specialty: null, // será enriquecido com template quando necessário
                status: form.status,
                appliedAt: form.appliedAt.toISOString(),
                completedAt: form.completedAt?.toISOString() ?? null,
                indexedFields: indexedFields.map((f) => ({
                    fieldLabel: f.fieldLabel,
                    value: f.valueText ?? f.valueNumber ?? f.valueBoolean ?? f.valueDate ?? f.valueJson ?? null,
                })),
            });
        }

        return result;
    }

    private computeContentHash(data: Record<string, unknown>): string {
        return createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
    }

    private calculateAge(birthDate: Date): number {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    private async persistSnapshot(
        patientId: PatientId,
        professionalId: ProfessionalId | null,
        output: PatientContextOutput,
        contentHash: string
    ): Promise<void> {
        const existing = await this.snapshotRepository.findByPatient(patientId, professionalId);

        if (existing) {
            // Atualizar snapshot existente
            existing.patientFacts = output.patientFacts;
            existing.criticalContext = output.criticalContext;
            existing.timelineSummary = output.timeline;
            existing.contentHash = contentHash;
            existing.markReady();
            await this.snapshotRepository.save(existing);
        } else {
            // Criar novo snapshot
            const snapshot = PatientContextSnapshot.create({
                patientId,
                professionalId,
                patientFacts: output.patientFacts,
                criticalContext: output.criticalContext,
                timelineSummary: output.timeline,
                contentHash,
                status: ContextSnapshotStatus.PENDING,
                builtAt: null,
            });
            snapshot.markReady();
            await this.snapshotRepository.save(snapshot);
        }
    }
}
