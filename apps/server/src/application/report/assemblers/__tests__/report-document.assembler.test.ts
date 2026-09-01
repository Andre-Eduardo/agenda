import {mock} from 'jest-mock-extended';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId} from '@domain/clinic/entities';
import {fakeClinic} from '@domain/clinic/entities/__tests__/fake-clinic';
import type {ReportPeriod, ReportSection} from '../../documents/report-document';
import {type ReportBuildContext, ReportDocumentAssembler} from '../report-document.assembler';

type FakeData = {rows: Array<{name: string; amount: number}>};
type FakePayload = {clinicId: ClinicId};

class FakeReportDocumentAssembler extends ReportDocumentAssembler<FakeData, FakePayload> {
    constructor(protected readonly clinicRepository: ClinicRepository) {
        super();
    }

    protected title(context: ReportBuildContext): string {
        return `Relatório de ${context.clinicName}`;
    }

    protected period(): ReportPeriod | null {
        return {from: new Date('2026-01-01'), to: new Date('2026-01-31'), label: 'Janeiro/2026'};
    }

    protected fileBaseName(): string {
        return this.slug('Relatório de Teste');
    }

    protected sections(data: FakeData, context: ReportBuildContext): ReportSection[] {
        const rows = data.rows.map((row) => ({name: row.name, amount: row.amount}));

        return [
            this.kpiSection('kpis', 'Indicadores', [this.kpi('Total', data.rows.length, 'integer')]),
            this.columns(
                'layout',
                [
                    this.table(
                        'rows',
                        'Linhas',
                        [
                            this.text('name', 'Nome'),
                            this.currency('amount', 'Valor'),
                            this.percentage('share', 'Participação'),
                            this.integer('visits', 'Visitas'),
                            this.number('score', 'Nota'),
                            this.date('lastSeenAt', 'Última visita'),
                        ],
                        rows,
                        {
                            total: this.sumRow(rows, ['amount'], {key: 'name', value: context.t('total')}),
                            emptyMessage: context.t('no_data'),
                            note: 'nota',
                        }
                    ),
                ],
                [
                    this.comparison('comparison', 'Comparativo', [
                        {label: 'Consultas', current: 10, previous: 8, changePercent: 25, format: 'integer'},
                    ]),
                ]
            ),
            this.paragraph('notes', 'Observações', 'Texto livre'),
        ];
    }
}

describe('ReportDocumentAssembler', () => {
    it('should assemble a ReportDocument from the resolved clinic and the subclass sections', async () => {
        const clinic = fakeClinic({name: 'Clínica Saúde Total'});
        const clinicRepository = mock<ClinicRepository>();

        clinicRepository.findById.mockResolvedValue(clinic);

        const assembler = new FakeReportDocumentAssembler(clinicRepository);
        const data: FakeData = {rows: [{name: 'Consulta', amount: 150}]};

        const document = await assembler.toDocument({payload: {clinicId: clinic.id}, data, locale: 'pt-BR'});

        expect(document.title).toBe('Relatório de Clínica Saúde Total');
        expect(document.subtitle).toBe('Clínica Saúde Total');
        expect(document.period?.label).toBe('Janeiro/2026');
        expect(document.fileBaseName).toBe('relatorio-de-teste');
        expect(document.context).toStrictEqual({locale: 'pt-BR', currency: 'BRL', timeZone: 'America/Sao_Paulo'});
        expect(document.sections).toHaveLength(3);

        const [kpiSection, columnsSection, textSection] = document.sections;

        expect(kpiSection).toMatchObject({kind: 'kpi', items: [{label: 'Total', value: 1, format: 'integer'}]});
        expect(columnsSection).toMatchObject({
            kind: 'columns',
            primary: [
                {
                    kind: 'table',
                    columns: [
                        {key: 'name', format: 'text', align: 'left'},
                        {key: 'amount', format: 'currency', align: 'right'},
                        {key: 'share', format: 'percentage', align: 'right'},
                        {key: 'visits', format: 'integer', align: 'right'},
                        {key: 'score', format: 'number', align: 'right'},
                        {key: 'lastSeenAt', format: 'date', align: 'right'},
                    ],
                    rows: [{name: 'Consulta', amount: 150}],
                    total: {name: 'Total', amount: 150},
                    emptyMessage: 'Sem dados para o período selecionado',
                    note: 'nota',
                },
            ],
            secondary: [
                {
                    kind: 'comparison',
                    rows: [{label: 'Consultas', current: 10, previous: 8, changePercent: 25, format: 'integer'}],
                },
            ],
        });
        expect(textSection).toStrictEqual({kind: 'text', id: 'notes', title: 'Observações', body: 'Texto livre'});
    });

    it('should throw when the clinic cannot be found', async () => {
        const clinicRepository = mock<ClinicRepository>();

        clinicRepository.findById.mockResolvedValue(null);

        const assembler = new FakeReportDocumentAssembler(clinicRepository);

        await expect(
            assembler.toDocument({payload: {clinicId: ClinicId.generate()}, data: {rows: []}, locale: 'pt-BR'})
        ).rejects.toThrow(ResourceNotFoundException);
    });

    it('should slugify a title with diacritics, spaces and mixed case', () => {
        const clinicRepository = mock<ClinicRepository>();
        const assembler = new FakeReportDocumentAssembler(clinicRepository);

        // Accesses the protected helper indirectly through fileBaseName(), already covered above;
        // this asserts the slug is stable for a value with more punctuation.
        expect(assembler.slug('  Relatório: Ação & Reação!!  ')).toBe('relatorio-acao-reacao');
    });
});
