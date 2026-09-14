import {useState} from 'react';
import {
    AxiosError,
    useCancel,
    useCreateEnrollment,
    useGetCurrentClinicMember,
    useListEnrollments,
    useListInsurancePlans,
    useListPackages,
    useListPackagePlans,
    useListPlans,
    useListSubscriptions,
    useSellPackage,
    useSetPrimary,
    useSubscribe,
    type ApiProblem,
    type PatientInsuranceEnrollment,
    type PatientPackage,
    type PatientSubscription,
} from '@agenda-app/client';
import {Plus} from 'lucide-react';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {
    block,
    blockHeader,
    blockTitle,
    card,
    cardActions,
    cardInfo,
    cardMeta,
    cardName,
    emptyText,
    formBody,
    formField,
    formFooter,
    hint,
    wrap,
} from './PatientPlansSection.styles';

function extractErrorDetail(error: unknown): string | null {
    if (!(error instanceof AxiosError)) return null;

    return (error.response?.data as ApiProblem | undefined)?.detail ?? null;
}

function formatBRL(value: number): string {
    return `R$ ${value.toFixed(2)}`;
}

function formatDate(value: string | null | undefined): string {
    if (!value) return '—';

    return new Date(value).toLocaleDateString('pt-BR');
}

const PACKAGE_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativo',
    DEPLETED: 'Esgotado',
    EXPIRED: 'Expirado',
    CANCELLED: 'Cancelado',
};

interface PatientPlansSectionProps {
    patientId: string;
}

export function PatientPlansSection({patientId}: PatientPlansSectionProps) {
    const memberQuery = useGetCurrentClinicMember();
    const clinicId = memberQuery.data?.clinicId ?? '';

    return (
        <div className={wrap}>
            <PackagesBlock patientId={patientId} />
            <SubscriptionBlock patientId={patientId} clinicId={clinicId} />
            <InsuranceBlock patientId={patientId} clinicId={clinicId} />
        </div>
    );
}

// ── Pacotes ───────────────────────────────────────────────────────────────────

function PackagesBlock({patientId}: {patientId: string}) {
    const [showForm, setShowForm] = useState(false);
    const packagesQuery = useListPackages(patientId, {query: {enabled: !!patientId}});
    const packages = packagesQuery.data ?? [];

    return (
        <div className={block}>
            <div className={blockHeader}>
                <span className={blockTitle}>Pacotes de sessão</span>
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                    <Plus className="size-3.5" /> Vender pacote
                </Button>
            </div>

            {packages.length === 0 ? (
                <p className={emptyText}>Nenhum pacote comprado.</p>
            ) : (
                packages.map((pkg: PatientPackage) => (
                    <div key={pkg.id} className={card}>
                        <div className={cardInfo}>
                            <span className={cardName}>{pkg.planNameSnapshot}</span>
                            <span className={cardMeta}>
                                {pkg.remainingCredits}/{pkg.totalCredits} créditos
                                {pkg.expiresAt ? ` · válido até ${formatDate(pkg.expiresAt)}` : ''}
                            </span>
                        </div>
                        <Badge variant={pkg.status === 'ACTIVE' ? 'success' : 'secondary'}>
                            {PACKAGE_STATUS_LABELS[pkg.status] ?? pkg.status}
                        </Badge>
                    </div>
                ))
            )}

            {showForm && (
                <SellPackageDialog
                    patientId={patientId}
                    onClose={() => setShowForm(false)}
                    onSold={() => packagesQuery.refetch()}
                />
            )}
        </div>
    );
}

function SellPackageDialog({
    patientId,
    onClose,
    onSold,
}: {
    patientId: string;
    onClose: () => void;
    onSold: () => void;
}) {
    const plansQuery = useListPackagePlans();
    const plans = (plansQuery.data ?? []).filter((p) => p.isActive);
    const [packagePlanId, setPackagePlanId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');

    const sell = useSellPackage();
    const canSubmit = !!packagePlanId && !sell.isPending;

    function handleSubmit() {
        if (!canSubmit) return;

        sell.mutate(
            {patientId, data: {packagePlanId, paymentMethod: paymentMethod as 'CASH'}},
            {
                onSuccess: () => {
                    toast.success('Pacote vendido');
                    onSold();
                    onClose();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao vender pacote'),
            }
        );
    }

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vender pacote de sessão</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label>Pacote</Label>
                        <Select value={packagePlanId} onValueChange={setPackagePlanId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um pacote" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} — {plan.totalCredits} créditos ({formatBRL(plan.priceBrl)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {plans.length === 0 && (
                            <span className={hint}>
                                Nenhum pacote ativo no catálogo. Cadastre um em Financeiro → Planos e Convênios.
                            </span>
                        )}
                    </div>
                    <div className={formField}>
                        <Label>Forma de pagamento do pacote</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Dinheiro</SelectItem>
                                <SelectItem value="PIX">Pix</SelectItem>
                                <SelectItem value="CREDIT_CARD">Cartão de crédito</SelectItem>
                                <SelectItem value="DEBIT_CARD">Cartão de débito</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Transferência</SelectItem>
                                <SelectItem value="COURTESY">Cortesia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {sell.isPending ? 'Vendendo…' : 'Vender pacote'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Assinatura ────────────────────────────────────────────────────────────────

function SubscriptionBlock({patientId, clinicId}: {patientId: string; clinicId: string}) {
    const [showForm, setShowForm] = useState(false);
    const subscriptionsQuery = useListSubscriptions(patientId, {query: {enabled: !!patientId}});
    const cancel = useCancel();
    const subscriptions = subscriptionsQuery.data ?? [];
    const active = subscriptions.find((s) => s.status === 'ACTIVE');

    function handleCancel(subscription: PatientSubscription) {
        cancel.mutate(
            {patientId, id: subscription.id, data: {reason: 'Cancelada pela clínica'}},
            {
                onSuccess: () => {
                    toast.success('Assinatura cancelada');
                    void subscriptionsQuery.refetch();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao cancelar assinatura'),
            }
        );
    }

    return (
        <div className={block}>
            <div className={blockHeader}>
                <span className={blockTitle}>Assinatura recorrente</span>
                {!active && (
                    <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                        <Plus className="size-3.5" /> Assinar
                    </Button>
                )}
            </div>

            {!active ? (
                <p className={emptyText}>Nenhuma assinatura ativa.</p>
            ) : (
                <div className={card}>
                    <div className={cardInfo}>
                        <span className={cardName}>{active.planNameSnapshot}</span>
                        <span className={cardMeta}>
                            {active.monthlyQuotaSnapshot} atendimentos/mês · período{' '}
                            {formatDate(active.currentPeriodStart)} – {formatDate(active.currentPeriodEnd)}
                        </span>
                    </div>
                    <div className={cardActions}>
                        <Badge variant="success">Ativa</Badge>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={cancel.isPending}
                            onClick={() => handleCancel(active)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {showForm && (
                <SubscribeDialog
                    patientId={patientId}
                    clinicId={clinicId}
                    onClose={() => setShowForm(false)}
                    onSubscribed={() => subscriptionsQuery.refetch()}
                />
            )}
        </div>
    );
}

function SubscribeDialog({
    patientId,
    onClose,
    onSubscribed,
}: {
    patientId: string;
    clinicId: string;
    onClose: () => void;
    onSubscribed: () => void;
}) {
    const plansQuery = useListPlans();
    const plans = (plansQuery.data ?? []).filter((p) => p.isActive);
    const [subscriptionPlanId, setSubscriptionPlanId] = useState('');

    const subscribe = useSubscribe();
    const canSubmit = !!subscriptionPlanId && !subscribe.isPending;

    function handleSubmit() {
        if (!canSubmit) return;

        subscribe.mutate(
            {patientId, data: {subscriptionPlanId}},
            {
                onSuccess: () => {
                    toast.success('Assinatura criada');
                    onSubscribed();
                    onClose();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao assinar plano'),
            }
        );
    }

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assinar plano recorrente</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label>Plano</Label>
                        <Select value={subscriptionPlanId} onValueChange={setSubscriptionPlanId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} — {plan.monthlyAppointmentQuota} atend./mês (
                                        {formatBRL(plan.priceBrl)}/mês)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {plans.length === 0 && (
                            <span className={hint}>
                                Nenhuma assinatura ativa no catálogo. Cadastre uma em Financeiro → Planos e
                                Convênios.
                            </span>
                        )}
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {subscribe.isPending ? 'Assinando…' : 'Assinar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Convênios ─────────────────────────────────────────────────────────────────

function InsuranceBlock({patientId, clinicId}: {patientId: string; clinicId: string}) {
    const [showForm, setShowForm] = useState(false);
    const enrollmentsQuery = useListEnrollments(patientId, {query: {enabled: !!patientId}});
    const insurancePlansQuery = useListInsurancePlans(clinicId, {query: {enabled: !!clinicId}});
    const setPrimary = useSetPrimary();
    const enrollments = enrollmentsQuery.data ?? [];
    const planNameById = new Map((insurancePlansQuery.data ?? []).map((p) => [p.id, p.name]));

    function handleSetPrimary(enrollment: PatientInsuranceEnrollment) {
        setPrimary.mutate(
            {patientId, id: enrollment.id},
            {
                onSuccess: () => {
                    toast.success('Convênio marcado como primário');
                    void enrollmentsQuery.refetch();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao atualizar convênio'),
            }
        );
    }

    return (
        <div className={block}>
            <div className={blockHeader}>
                <span className={blockTitle}>Convênios vinculados</span>
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                    <Plus className="size-3.5" /> Vincular convênio
                </Button>
            </div>

            {enrollments.length === 0 ? (
                <p className={emptyText}>Nenhum convênio vinculado.</p>
            ) : (
                enrollments.map((enrollment: PatientInsuranceEnrollment) => (
                    <div key={enrollment.id} className={card}>
                        <div className={cardInfo}>
                            <span className={cardName}>
                                {planNameById.get(enrollment.insurancePlanId) ?? 'Convênio'}
                            </span>
                            {enrollment.cardNumber && <span className={cardMeta}>{enrollment.cardNumber}</span>}
                        </div>
                        <div className={cardActions}>
                            {enrollment.isPrimary ? (
                                <Badge variant="success">Primário</Badge>
                            ) : (
                                enrollment.status === 'ACTIVE' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={setPrimary.isPending}
                                        onClick={() => handleSetPrimary(enrollment)}
                                    >
                                        Tornar primário
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                ))
            )}

            {showForm && (
                <LinkInsuranceDialog
                    patientId={patientId}
                    clinicId={clinicId}
                    onClose={() => setShowForm(false)}
                    onLinked={() => enrollmentsQuery.refetch()}
                />
            )}
        </div>
    );
}

function LinkInsuranceDialog({
    patientId,
    clinicId,
    onClose,
    onLinked,
}: {
    patientId: string;
    clinicId: string;
    onClose: () => void;
    onLinked: () => void;
}) {
    const plansQuery = useListInsurancePlans(clinicId, {query: {enabled: !!clinicId}});
    const plans = (plansQuery.data ?? []).filter((p) => p.isActive);
    const [insurancePlanId, setInsurancePlanId] = useState('');
    const [cardNumber, setCardNumber] = useState('');

    const create = useCreateEnrollment();
    const canSubmit = !!insurancePlanId && !create.isPending;

    function handleSubmit() {
        if (!canSubmit) return;

        create.mutate(
            {patientId, data: {insurancePlanId, cardNumber: cardNumber || null}},
            {
                onSuccess: () => {
                    toast.success('Convênio vinculado');
                    onLinked();
                    onClose();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao vincular convênio'),
            }
        );
    }

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vincular convênio</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label>Convênio</Label>
                        <Select value={insurancePlanId} onValueChange={setInsurancePlanId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um convênio" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {plans.length === 0 && (
                            <span className={hint}>
                                Nenhum convênio cadastrado. Cadastre um em Financeiro → Planos e Convênios.
                            </span>
                        )}
                    </div>
                    <div className={formField}>
                        <Label>
                            Número da carteirinha <span className={hint}>opcional</span>
                        </Label>
                        <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {create.isPending ? 'Vinculando…' : 'Vincular convênio'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
