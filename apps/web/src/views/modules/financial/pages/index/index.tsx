import {useState} from 'react';
import {
    useGetClinicBillingReport,
    useGetCurrentClinicMember,
    useGetRevenueReport,
    useGetRevenueSummary,
    useListClinicMembers,
    type GetRevenueReportParams,
} from '@agenda-app/client';
import {createFileRoute} from '@tanstack/react-router';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Badge, type badgeVariants} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {SegmentedControl, SegmentedControlItem} from '@/components/ui/componentes/segmented-control';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/componentes/table';
import {Page} from '@/views/components/Page';
import {PlansTab} from '@/views/modules/financial/components/PlansTab';
import {
    emptyText,
    filterBar,
    filterField,
    filterLabel,
    highlightCard,
    highlightRow,
    paginationActions,
    paginationBar,
    paginationInfo,
    sectionBlock,
    sectionTitleText,
    skeletonBlock,
    statCard,
    statGrid,
    statLabel,
    statSub,
    statValue,
    tabPanel,
} from './styles';

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_stackedLayout/financial')({
    component: FinancialPage,
});

// ─── Shared labels ───────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: 'Dinheiro',
    PIX: 'Pix',
    CREDIT_CARD: 'Cartão de crédito',
    DEBIT_CARD: 'Cartão de débito',
    BANK_TRANSFER: 'Transferência',
    INSURANCE: 'Convênio',
    COURTESY: 'Cortesia',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    EXEMPT: 'Isento',
    REFUNDED: 'Reembolsado',
};

const PAYMENT_STATUS_BADGE: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    PAID: 'success',
    EXEMPT: 'secondary',
    REFUNDED: 'destructive',
};

const PLAN_LABELS: Record<string, string> = {
    STARTER: 'Starter',
    CONSULTORIO: 'Consultório',
    CLINICA: 'Clínica',
    ESPECIALISTA: 'Especialista',
};

function formatBRL(value: number): string {
    return `R$ ${value.toFixed(2)}`;
}

function firstDayOfMonth(): string {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

// ─── Page ────────────────────────────────────────────────────────────────────

function FinancialPage() {
    const memberQuery = useGetCurrentClinicMember();
    const clinicId = memberQuery.data?.clinicId ?? '';
    const [tab, setTab] = useState<'receita' | 'custos' | 'planos'>('receita');

    return (
        <Page title="Financeiro" subtitle="Receita da clínica, custo por profissional e planos do paciente.">
            <SegmentedControl value={tab} onValueChange={(v) => setTab(v as 'receita' | 'custos' | 'planos')}>
                <SegmentedControlItem value="receita">Receita</SegmentedControlItem>
                <SegmentedControlItem value="custos">Custos</SegmentedControlItem>
                <SegmentedControlItem value="planos">Planos e Convênios</SegmentedControlItem>
            </SegmentedControl>

            {tab === 'receita' && <RevenueTab clinicId={clinicId} />}
            {tab === 'custos' && <CostsTab clinicId={clinicId} />}
            {tab === 'planos' && <PlansTab clinicId={clinicId} />}
        </Page>
    );
}

// ─── Receita ─────────────────────────────────────────────────────────────────

function RevenueTab({clinicId}: {clinicId: string}) {
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [professionalMemberId, setProfessionalMemberId] = useState('ALL');
    const [paymentMethod, setPaymentMethod] = useState('ALL');
    const [status, setStatus] = useState('ALL');
    const [page, setPage] = useState(1);

    const professionalsQuery = useListClinicMembers({clinicId}, {query: {enabled: !!clinicId}});
    const professionals = (professionalsQuery.data ?? []).filter((m) => m.roles.includes('PROFESSIONAL'));

    const filters: GetRevenueReportParams = {
        startDate,
        endDate,
        ...(professionalMemberId !== 'ALL' ? {professionalMemberId} : {}),
        ...(paymentMethod !== 'ALL' ? {paymentMethod: paymentMethod as GetRevenueReportParams['paymentMethod']} : {}),
        ...(status !== 'ALL' ? {status: status as GetRevenueReportParams['status']} : {}),
    };

    const enabled = !!clinicId && !!startDate && !!endDate;
    const summaryQuery = useGetRevenueSummary(clinicId, filters, {query: {enabled}});
    const reportQuery = useGetRevenueReport(clinicId, {...filters, page, pageSize: 20}, {query: {enabled}});

    const summary = summaryQuery.data?.summary;
    // Orval mistypes this nested object as `{[key: string]: unknown}` (same known codegen issue
    // documented for Update*Dto partial updates elsewhere in this app).
    const pagination = reportQuery.data?.pagination as {page: number; pageSize: number; total: number} | undefined;
    const payments = reportQuery.data?.payments ?? [];
    const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

    function updateFilter<T>(setter: (v: T) => void) {
        return (value: T) => {
            setter(value);
            setPage(1);
        };
    }

    return (
        <div className={tabPanel}>
            <div className={filterBar}>
                <div className={filterField}>
                    <Label className={filterLabel}>Início</Label>
                    <Input type="date" value={startDate} onChange={(e) => updateFilter(setStartDate)(e.target.value)} />
                </div>
                <div className={filterField}>
                    <Label className={filterLabel}>Fim</Label>
                    <Input type="date" value={endDate} onChange={(e) => updateFilter(setEndDate)(e.target.value)} />
                </div>
                <div className={filterField}>
                    <Label className={filterLabel}>Profissional</Label>
                    <Select value={professionalMemberId} onValueChange={updateFilter(setProfessionalMemberId)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            {professionals.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.displayName ?? 'Sem nome'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={filterField}>
                    <Label className={filterLabel}>Forma de pagamento</Label>
                    <Select value={paymentMethod} onValueChange={updateFilter(setPaymentMethod)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas</SelectItem>
                            {Object.entries(PAYMENT_METHOD_LABELS).map(([code, label]) => (
                                <SelectItem key={code} value={code}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={filterField}>
                    <Label className={filterLabel}>Status</Label>
                    <Select value={status} onValueChange={updateFilter(setStatus)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            {Object.entries(PAYMENT_STATUS_LABELS).map(([code, label]) => (
                                <SelectItem key={code} value={code}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {summaryQuery.isLoading ? (
                <Skeleton className={skeletonBlock} />
            ) : (
                summary && (
                    <div className={statGrid}>
                        <div className={statCard}>
                            <span className={statLabel}>Receita total</span>
                            <span className={statValue}>{formatBRL(summary.totalBrl)}</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Pago</span>
                            <span className={statValue}>{formatBRL(summary.totalPaid)}</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Pendente</span>
                            <span className={statValue}>{formatBRL(summary.totalPending)}</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Isento</span>
                            <span className={statValue}>{formatBRL(summary.totalExempt)}</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Reembolsado</span>
                            <span className={statValue}>{formatBRL(summary.totalRefunded)}</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Consultas</span>
                            <span className={statValue}>{summary.appointmentCount}</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Ticket médio</span>
                            <span className={statValue}>{formatBRL(summary.avgTicketBrl)}</span>
                        </div>
                    </div>
                )
            )}

            {(summaryQuery.data?.byPaymentMethod.length ?? 0) > 0 && (
                <div className={sectionBlock}>
                    <span className={sectionTitleText}>Por forma de pagamento</span>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Método</TableHead>
                                <TableHead>Qtd.</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(summaryQuery.data?.byPaymentMethod ?? []).map((row) => (
                                <TableRow key={row.method}>
                                    <TableCell>{PAYMENT_METHOD_LABELS[row.method] ?? row.method}</TableCell>
                                    <TableCell>{row.count}</TableCell>
                                    <TableCell>{formatBRL(row.totalBrl)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {(summaryQuery.data?.byProfessional.length ?? 0) > 0 && (
                <div className={sectionBlock}>
                    <span className={sectionTitleText}>Por profissional</span>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Profissional</TableHead>
                                <TableHead>Qtd.</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(summaryQuery.data?.byProfessional ?? []).map((row) => (
                                <TableRow key={row.memberId}>
                                    <TableCell>{row.displayName}</TableCell>
                                    <TableCell>{row.count}</TableCell>
                                    <TableCell>{formatBRL(row.totalBrl)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <div className={sectionBlock}>
                <span className={sectionTitleText}>Pagamentos no período</span>
                {reportQuery.isLoading && <Skeleton className={skeletonBlock} />}

                {!reportQuery.isLoading && payments.length === 0 && (
                    <p className={emptyText}>Nenhum pagamento encontrado para os filtros selecionados.</p>
                )}

                {!reportQuery.isLoading && payments.length > 0 && (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Paciente</TableHead>
                                    <TableHead>Profissional</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.paymentId}>
                                        <TableCell>{payment.patientName}</TableCell>
                                        <TableCell>{payment.professionalName}</TableCell>
                                        <TableCell>
                                            {new Date(payment.appointmentDate).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell>
                                            {PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={PAYMENT_STATUS_BADGE[payment.status] ?? 'outline'}>
                                                {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatBRL(payment.amountBrl)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {pagination && (
                            <div className={paginationBar}>
                                <span className={paginationInfo}>
                                    Página {pagination.page} de {totalPages} · {pagination.total} pagamento(s)
                                </span>
                                <div className={paginationActions}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                    >
                                        <ChevronLeft size={14} />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Custos ──────────────────────────────────────────────────────────────────

function monthOptions(): number[] {
    return Array.from({length: 12}, (_, i) => i + 1);
}

function CostsTab({clinicId}: {clinicId: string}) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const reportQuery = useGetClinicBillingReport(clinicId, {year, month}, {query: {enabled: !!clinicId}});
    const report = reportQuery.data;

    return (
        <div className={tabPanel}>
            <div className={filterBar}>
                <div className={filterField}>
                    <Label className={filterLabel}>Ano</Label>
                    <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                </div>
                <div className={filterField}>
                    <Label className={filterLabel}>Mês</Label>
                    <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions().map((m) => (
                                <SelectItem key={m} value={String(m)}>
                                    {String(m).padStart(2, '0')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {reportQuery.isLoading && <Skeleton className={skeletonBlock} />}

            {!reportQuery.isLoading && !report && <p className={emptyText}>Nenhum dado para o período selecionado.</p>}

            {!reportQuery.isLoading && report && (
                <>
                    <div className={statGrid}>
                        <div className={statCard}>
                            <span className={statLabel}>Receita de planos</span>
                            <span className={statValue}>{formatBRL(report.summary.totalRevenueBrl)}</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Custo de IA</span>
                            <span className={statValue}>{formatBRL(report.summary.totalAiCostBrl)}</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Margem média</span>
                            <span className={statValue}>{report.summary.avgMarginPercent.toFixed(1)}%</span>
                        </div>
                        <div className={statCard}>
                            <span className={statLabel}>Membros</span>
                            <span className={statValue}>{report.summary.totalMembers}</span>
                        </div>
                    </div>

                    {(report.summary.mostExpensiveMember ?? report.summary.mostActiveByChat) && (
                        <div className={highlightRow}>
                            {report.summary.mostExpensiveMember && (
                                <div className={highlightCard}>
                                    <span className={statLabel}>Membro mais caro (IA)</span>
                                    <span className={sectionTitleText}>
                                        {report.summary.mostExpensiveMember.displayName}
                                    </span>
                                    <span className={statSub}>
                                        US$ {report.summary.mostExpensiveMember.aiCostUsd.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            {report.summary.mostActiveByChat && (
                                <div className={highlightCard}>
                                    <span className={statLabel}>Mais ativo no chat</span>
                                    <span className={sectionTitleText}>
                                        {report.summary.mostActiveByChat.displayName}
                                    </span>
                                    <span className={statSub}>
                                        {report.summary.mostActiveByChat.messages} mensagens
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={sectionBlock}>
                        <span className={sectionTitleText}>Por membro</span>
                        {report.members.length === 0 ? (
                            <p className={emptyText}>Nenhum profissional com assinatura ativa no período.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Profissional</TableHead>
                                        <TableHead>Plano</TableHead>
                                        <TableHead>Docs</TableHead>
                                        <TableHead>Chat</TableHead>
                                        <TableHead>Imagens</TableHead>
                                        <TableHead>Custo IA</TableHead>
                                        <TableHead>Receita</TableHead>
                                        <TableHead>Margem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.members.map((m) => (
                                        <TableRow key={m.memberId}>
                                            <TableCell>{m.displayName}</TableCell>
                                            <TableCell>{PLAN_LABELS[m.planCode] ?? m.planCode}</TableCell>
                                            <TableCell>{m.docsCount}</TableCell>
                                            <TableCell>{m.chatMessages}</TableCell>
                                            <TableCell>{m.imagesCount}</TableCell>
                                            <TableCell>{formatBRL(m.totalAiCostBrl)}</TableCell>
                                            <TableCell>{formatBRL(m.planRevenueBrl)}</TableCell>
                                            <TableCell>{m.grossMarginPercent.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
