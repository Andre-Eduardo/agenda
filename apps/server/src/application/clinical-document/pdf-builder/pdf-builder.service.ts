import {Injectable} from '@nestjs/common';
import type {TDocumentDefinitions, Content} from 'pdfmake/interfaces';
import type {
    ClinicalDocument,
    PrescriptionContent,
    MedicalCertificateContent,
    ReferralContent,
    ExamRequestContent,
} from '../../../domain/clinical-document/entities';
import {ClinicalDocumentType} from '../../../domain/clinical-document/entities';
import type {LayoutJson} from '../../../domain/clinical-document/entities/clinical-document-template.entity';

type ClinicContext = {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
};

type ProfessionalContext = {
    name: string;
    registrationNumber?: string;
    specialty?: string;
};

type PatientContext = {
    name: string;
    documentId?: string;
    birthDate?: string;
};

export type PdfBuildContext = {
    clinic: ClinicContext;
    professional: ProfessionalContext;
    patient: PatientContext;
    document: ClinicalDocument;
    layoutJson: LayoutJson;
};

@Injectable()
export class PdfBuilderService {
    async generateBuffer(ctx: PdfBuildContext): Promise<Buffer> {
        const docDefinition = this.buildDocDefinition(ctx);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfmake = require('pdfmake/build/pdfmake') as typeof import('pdfmake');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const HelveticaFont = require('pdfmake/build/standard-fonts/Helvetica');

        pdfmake.addFontContainer(HelveticaFont);
        const pdf = pdfmake.createPdf(docDefinition);

        return pdf.getBuffer();
    }

    private buildDocDefinition(ctx: PdfBuildContext): TDocumentDefinitions {
        const {clinic, professional, patient, document, layoutJson} = ctx;

        const layoutOverrides = layoutJson as Partial<TDocumentDefinitions>;
        const margins: [number, number, number, number] = [40, 60, 40, 60];

        const header: Content = {
            stack: [
                {
                    columns: [
                        {
                            stack: [
                                {text: clinic.name, style: 'clinicName'},
                                clinic.address ? {text: clinic.address, style: 'clinicDetail'} : '',
                                clinic.phone ? {text: `Tel: ${clinic.phone}`, style: 'clinicDetail'} : '',
                                clinic.email ? {text: clinic.email, style: 'clinicDetail'} : '',
                            ],
                        },
                    ],
                },
                {canvas: [{type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#cccccc'}]},
            ],
            margin: [40, 20, 40, 10],
        };

        const footer = (currentPage: number, pageCount: number): Content => ({
            stack: [
                {canvas: [{type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc'}]},
                {
                    columns: [
                        {
                            stack: [
                                {text: professional.name, style: 'footerProfessional'},
                                professional.registrationNumber
                                    ? {
                                          text: professional.registrationNumber,
                                          style: 'footerDetail',
                                      }
                                    : '',
                                professional.specialty
                                    ? {text: professional.specialty, style: 'footerDetail'}
                                    : '',
                            ],
                        },
                        {
                            text: `Página ${currentPage} de ${pageCount}`,
                            style: 'footerPage',
                            alignment: 'right',
                        },
                    ],
                },
            ],
            margin: [40, 5, 40, 10],
        });

        const patientSection: Content = {
            table: {
                widths: ['*'],
                body: [
                    [
                        {
                            stack: [
                                {text: 'Paciente', style: 'sectionLabel'},
                                {text: patient.name, style: 'patientName'},
                                patient.documentId
                                    ? {text: `CPF: ${patient.documentId}`, style: 'patientDetail'}
                                    : '',
                                patient.birthDate
                                    ? {text: `Data de Nascimento: ${patient.birthDate}`, style: 'patientDetail'}
                                    : '',
                            ],
                            fillColor: '#f8f8f8',
                            margin: [8, 8, 8, 8],
                        },
                    ],
                ],
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 16],
        };

        const documentTitle = this.getDocumentTitle(document.type);
        const documentDate = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

        const titleSection: Content = {
            stack: [
                {text: documentTitle, style: 'documentTitle'},
                {text: documentDate, style: 'documentDate'},
            ],
            margin: [0, 0, 0, 20],
        };

        const contentSection = this.buildContentSection(document);

        const signatureSection: Content = {
            stack: [
                {canvas: [{type: 'line', x1: 100, y1: 40, x2: 400, y2: 40, lineWidth: 0.5, lineColor: '#333333'}]},
                {text: professional.name, style: 'signatureName', alignment: 'center'},
                professional.registrationNumber
                    ? {text: professional.registrationNumber, style: 'signatureDetail', alignment: 'center'}
                    : '',
            ],
            margin: [0, 40, 0, 0],
        };

        return {
            ...layoutOverrides,
            pageSize: 'A4',
            pageMargins: margins,
            header,
            footer,
            content: [titleSection, patientSection, contentSection, signatureSection],
            styles: {
                clinicName: {fontSize: 14, bold: true, color: '#1a1a2e'},
                clinicDetail: {fontSize: 9, color: '#666666'},
                documentTitle: {fontSize: 16, bold: true, alignment: 'center', color: '#1a1a2e'},
                documentDate: {fontSize: 10, alignment: 'center', color: '#666666', margin: [0, 4, 0, 0]},
                sectionLabel: {fontSize: 8, bold: true, color: '#888888', margin: [0, 0, 0, 2]},
                patientName: {fontSize: 12, bold: true, color: '#1a1a2e'},
                patientDetail: {fontSize: 10, color: '#444444'},
                medicationName: {fontSize: 11, bold: true, color: '#1a1a2e'},
                medicationDetail: {fontSize: 10, color: '#444444'},
                sectionHeader: {fontSize: 11, bold: true, color: '#1a1a2e', margin: [0, 8, 0, 4]},
                bodyText: {fontSize: 10, color: '#333333', lineHeight: 1.5},
                footerProfessional: {fontSize: 9, bold: true, color: '#333333'},
                footerDetail: {fontSize: 8, color: '#666666'},
                footerPage: {fontSize: 8, color: '#888888'},
                signatureName: {fontSize: 10, bold: true, color: '#1a1a2e'},
                signatureDetail: {fontSize: 9, color: '#666666'},
                observations: {fontSize: 10, color: '#555555', italics: true, margin: [0, 8, 0, 0]},
                ...layoutOverrides.styles,
            },
            defaultStyle: {
                font: 'Helvetica',
                fontSize: 10,
                ...layoutOverrides.defaultStyle,
            },
        };
    }

    private getDocumentTitle(type: ClinicalDocumentType): string {
        const titles: Record<ClinicalDocumentType, string> = {
            [ClinicalDocumentType.PRESCRIPTION]: 'RECEITUÁRIO MÉDICO',
            [ClinicalDocumentType.PRESCRIPTION_SPECIAL]: 'RECEITUÁRIO ESPECIAL (CONTROLADO)',
            [ClinicalDocumentType.MEDICAL_CERTIFICATE]: 'ATESTADO MÉDICO',
            [ClinicalDocumentType.REFERRAL]: 'ENCAMINHAMENTO',
            [ClinicalDocumentType.EXAM_REQUEST]: 'SOLICITAÇÃO DE EXAMES',
        };

        return titles[type];
    }

    private buildContentSection(document: ClinicalDocument): Content {
        switch (document.type) {
            case ClinicalDocumentType.PRESCRIPTION:
            case ClinicalDocumentType.PRESCRIPTION_SPECIAL: {
                return this.buildPrescriptionContent(document.contentJson as PrescriptionContent);
            }
            case ClinicalDocumentType.MEDICAL_CERTIFICATE: {
                return this.buildCertificateContent(document.contentJson as MedicalCertificateContent);
            }
            case ClinicalDocumentType.REFERRAL: {
                return this.buildReferralContent(document.contentJson as ReferralContent);
            }
            case ClinicalDocumentType.EXAM_REQUEST: {
                return this.buildExamRequestContent(document.contentJson as ExamRequestContent);
            }
        }
    }

    private buildPrescriptionContent(content: PrescriptionContent): Content {
        const medItemMargin: [number, number, number, number] = [0, 0, 0, 8];
        const medicationRows = content.medications.map((med, idx) => ({
            stack: [
                {
                    columns: [
                        {text: `${idx + 1}.`, width: 20, style: 'medicationName'},
                        {text: med.name, style: 'medicationName'},
                    ],
                },
                {text: `${med.dosage} — ${med.frequency} por ${med.duration}`, style: 'medicationDetail', margin: [20, 0, 0, 0] as [number, number, number, number]},
                med.instructions
                    ? {text: `Instruções: ${med.instructions}`, style: 'medicationDetail', margin: [20, 0, 0, 4] as [number, number, number, number]}
                    : {text: '', margin: [0, 0, 0, 4] as [number, number, number, number]},
            ],
            margin: medItemMargin,
        }));

        return {
            stack: [
                {text: 'Medicamentos', style: 'sectionHeader'},
                ...medicationRows,
                content.observations
                    ? {text: `Observações: ${content.observations}`, style: 'observations'}
                    : '',
            ],
        };
    }

    private buildCertificateContent(content: MedicalCertificateContent): Content {
        const [year, month, day] = content.startDate.split('-');
        const startDate = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR');

        return {
            stack: [
                {
                    text: `Atesto para os devidos fins que o(a) paciente encontra-se ${content.reason}, necessitando de afastamento de suas atividades pelo período de ${content.daysOff} dia(s), a partir de ${startDate}.`,
                    style: 'bodyText',
                },
                content.cid ? {text: `CID-10: ${content.cid}`, style: 'bodyText', margin: [0, 8, 0, 0]} : '',
                content.observations ? {text: `Observações: ${content.observations}`, style: 'observations'} : '',
            ],
        };
    }

    private buildReferralContent(content: ReferralContent): Content {
        const urgencyLabel: Record<string, string> = {
            ROUTINE: 'Rotina',
            PRIORITY: 'Prioritário',
            URGENT: 'Urgente',
        };

        return {
            stack: [
                {text: 'Encaminho para avaliação e conduta:', style: 'sectionHeader'},
                {
                    table: {
                        widths: ['30%', '70%'],
                        body: [
                            [{text: 'Especialidade:', bold: true, style: 'bodyText'}, {text: content.specialty, style: 'bodyText'}],
                            [{text: 'Motivo:', bold: true, style: 'bodyText'}, {text: content.reason, style: 'bodyText'}],
                            [{text: 'Prioridade:', bold: true, style: 'bodyText'}, {text: urgencyLabel[content.urgency] ?? content.urgency, style: 'bodyText'}],
                        ],
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 8],
                },
                content.observations ? {text: `Observações: ${content.observations}`, style: 'observations'} : '',
            ],
        };
    }

    private buildExamRequestContent(content: ExamRequestContent): Content {
        const examItemMargin: [number, number, number, number] = [0, 0, 0, 6];
        const examRows = content.exams.map((exam, idx) => ({
            stack: [
                {
                    columns: [
                        {text: `${idx + 1}.`, width: 20, style: 'medicationName'},
                        {
                            stack: [
                                {
                                    text: exam.code ? `${exam.name} (${exam.code})` : exam.name,
                                    style: 'medicationName',
                                },
                                exam.justification
                                    ? {text: `Justificativa: ${exam.justification}`, style: 'medicationDetail'}
                                    : '',
                            ],
                        },
                    ],
                },
            ],
            margin: examItemMargin,
        }));

        return {
            stack: [
                {text: 'Exames Solicitados', style: 'sectionHeader'},
                ...examRows,
                content.priority ? {text: `Prioridade: ${content.priority}`, style: 'bodyText', margin: [0, 8, 0, 0]} : '',
                content.observations ? {text: `Observações: ${content.observations}`, style: 'observations'} : '',
            ],
        };
    }
}
