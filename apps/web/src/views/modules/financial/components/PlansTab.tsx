import {useState} from 'react';
import {
    AxiosError,
    useCreateInsurancePlan,
    useCreatePackagePlan,
    useCreatePlan,
    useDeactivatePackagePlan,
    useDeactivatePlan,
    useListInsurancePlans,
    useListPackagePlans,
    useListPlans,
    type ApiProblem,
    type InsurancePlan,
    type PackagePlan,
    type PatientSubscriptionPlan,
} from '@agenda-app/client';
import {Plus} from 'lucide-react';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {Textarea} from '@/components/ui/componentes/textarea';
import {
    emptyText,
    formBody,
    formField,
    formFooter,
    formRow,
    row,
    rowActions,
    rowInfo,
    rowMeta,
    rowName,
    section,
    sectionHeader,
    sectionSub,
    sectionTitle,
    wrap,
} from './PlansTab.styles';

function extractErrorDetail(error: unknown): string | null {
    if (!(error instanceof AxiosError)) return null;

    return (error.response?.data as ApiProblem | undefined)?.detail ?? null;
}

function formatBRL(value: number): string {
    return `R$ ${value.toFixed(2)}`;
}

interface PlansTabProps {
    clinicId: string;
}

export function PlansTab({clinicId}: PlansTabProps) {
    return (
        <div className={wrap}>
            <PackagePlansSection />
            <SubscriptionPlansSection />
            <InsurancePlansSection clinicId={clinicId} />
        </div>
    );
}

// ── Pacotes de sessão ────────────────────────────────────────────────────────

function PackagePlansSection() {
    const [showForm, setShowForm] = useState(false);
    const plansQuery = useListPackagePlans();
    const deactivate = useDeactivatePackagePlan();
    const plans = plansQuery.data ?? [];

    function handleDeactivate(plan: PackagePlan) {
        deactivate.mutate(
            {id: plan.id},
            {
                onSuccess: () => {
                    toast.success('Pacote desativado');
                    void plansQuery.refetch();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao desativar pacote'),
            }
        );
    }

    return (
        <div className={section}>
            <div className={sectionHeader}>
                <div>
                    <div className={sectionTitle}>Pacotes de sessão</div>
                    <div className={sectionSub}>Catálogo de pacotes de créditos que a clínica vende.</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                    <Plus className="size-3.5" /> Novo pacote
                </Button>
            </div>

            {plans.length === 0 ? (
                <p className={emptyText}>Nenhum pacote cadastrado ainda.</p>
            ) : (
                plans.map((plan) => (
                    <div key={plan.id} className={row}>
                        <div className={rowInfo}>
                            <span className={rowName}>{plan.name}</span>
                            <span className={rowMeta}>
                                {plan.totalCredits} créditos · {formatBRL(plan.priceBrl)}
                                {plan.validityDays ? ` · validade ${plan.validityDays}d` : ''}
                            </span>
                        </div>
                        <div className={rowActions}>
                            <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                                {plan.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {plan.isActive && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={deactivate.isPending}
                                    onClick={() => handleDeactivate(plan)}
                                >
                                    Desativar
                                </Button>
                            )}
                        </div>
                    </div>
                ))
            )}

            {showForm && (
                <CreatePackagePlanDialog onClose={() => setShowForm(false)} onCreated={() => plansQuery.refetch()} />
            )}
        </div>
    );
}

function CreatePackagePlanDialog({onClose, onCreated}: {onClose: () => void; onCreated: () => void}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [totalCredits, setTotalCredits] = useState('');
    const [priceBrl, setPriceBrl] = useState('');
    const [validityDays, setValidityDays] = useState('');

    const create = useCreatePackagePlan();
    const canSubmit = !!name && Number(totalCredits) > 0 && Number(priceBrl) > 0 && !create.isPending;

    function handleSubmit() {
        if (!canSubmit) return;

        create.mutate(
            {
                data: {
                    name,
                    description: description || null,
                    totalCredits: Number(totalCredits),
                    priceBrl: Number(priceBrl),
                    validityDays: validityDays ? Number(validityDays) : null,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Pacote criado');
                    onCreated();
                    onClose();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao criar pacote'),
            }
        );
    }

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo pacote de sessão</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label>Nome</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="10 sessões" />
                    </div>
                    <div className={formField}>
                        <Label>
                            Descrição <span className={sectionSub}>opcional</span>
                        </Label>
                        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className={formRow}>
                        <div className={formField}>
                            <Label>Créditos</Label>
                            <Input
                                type="number"
                                min={1}
                                value={totalCredits}
                                onChange={(e) => setTotalCredits(e.target.value)}
                                placeholder="10"
                            />
                        </div>
                        <div className={formField}>
                            <Label>Preço (R$)</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={priceBrl}
                                onChange={(e) => setPriceBrl(e.target.value)}
                                placeholder="1000.00"
                            />
                        </div>
                    </div>
                    <div className={formField}>
                        <Label>
                            Validade (dias) <span className={sectionSub}>opcional</span>
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            value={validityDays}
                            onChange={(e) => setValidityDays(e.target.value)}
                            placeholder="Sem expiração"
                        />
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {create.isPending ? 'Criando…' : 'Criar pacote'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Assinaturas recorrentes ──────────────────────────────────────────────────

function SubscriptionPlansSection() {
    const [showForm, setShowForm] = useState(false);
    const plansQuery = useListPlans();
    const deactivate = useDeactivatePlan();
    const plans = plansQuery.data ?? [];

    function handleDeactivate(plan: PatientSubscriptionPlan) {
        deactivate.mutate(
            {id: plan.id},
            {
                onSuccess: () => {
                    toast.success('Assinatura desativada');
                    void plansQuery.refetch();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao desativar assinatura'),
            }
        );
    }

    return (
        <div className={section}>
            <div className={sectionHeader}>
                <div>
                    <div className={sectionTitle}>Assinaturas recorrentes</div>
                    <div className={sectionSub}>Planos mensais com cota de atendimentos.</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                    <Plus className="size-3.5" /> Nova assinatura
                </Button>
            </div>

            {plans.length === 0 ? (
                <p className={emptyText}>Nenhuma assinatura cadastrada ainda.</p>
            ) : (
                plans.map((plan) => (
                    <div key={plan.id} className={row}>
                        <div className={rowInfo}>
                            <span className={rowName}>{plan.name}</span>
                            <span className={rowMeta}>
                                {plan.monthlyAppointmentQuota} atendimentos/mês · {formatBRL(plan.priceBrl)}/mês
                            </span>
                        </div>
                        <div className={rowActions}>
                            <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                                {plan.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {plan.isActive && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={deactivate.isPending}
                                    onClick={() => handleDeactivate(plan)}
                                >
                                    Desativar
                                </Button>
                            )}
                        </div>
                    </div>
                ))
            )}

            {showForm && (
                <CreateSubscriptionPlanDialog
                    onClose={() => setShowForm(false)}
                    onCreated={() => plansQuery.refetch()}
                />
            )}
        </div>
    );
}

function CreateSubscriptionPlanDialog({onClose, onCreated}: {onClose: () => void; onCreated: () => void}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [monthlyAppointmentQuota, setMonthlyAppointmentQuota] = useState('');
    const [priceBrl, setPriceBrl] = useState('');

    const create = useCreatePlan();
    const canSubmit = !!name && Number(monthlyAppointmentQuota) > 0 && Number(priceBrl) > 0 && !create.isPending;

    function handleSubmit() {
        if (!canSubmit) return;

        create.mutate(
            {
                data: {
                    name,
                    description: description || null,
                    monthlyAppointmentQuota: Number(monthlyAppointmentQuota),
                    priceBrl: Number(priceBrl),
                },
            },
            {
                onSuccess: () => {
                    toast.success('Assinatura criada');
                    onCreated();
                    onClose();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao criar assinatura'),
            }
        );
    }

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova assinatura recorrente</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label>Nome</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mensal 4 sessões" />
                    </div>
                    <div className={formField}>
                        <Label>
                            Descrição <span className={sectionSub}>opcional</span>
                        </Label>
                        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className={formRow}>
                        <div className={formField}>
                            <Label>Atendimentos/mês</Label>
                            <Input
                                type="number"
                                min={1}
                                value={monthlyAppointmentQuota}
                                onChange={(e) => setMonthlyAppointmentQuota(e.target.value)}
                                placeholder="4"
                            />
                        </div>
                        <div className={formField}>
                            <Label>Preço mensal (R$)</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={priceBrl}
                                onChange={(e) => setPriceBrl(e.target.value)}
                                placeholder="400.00"
                            />
                        </div>
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {create.isPending ? 'Criando…' : 'Criar assinatura'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Convênios ─────────────────────────────────────────────────────────────────

function InsurancePlansSection({clinicId}: {clinicId: string}) {
    const [showForm, setShowForm] = useState(false);
    const plansQuery = useListInsurancePlans(clinicId, {query: {enabled: !!clinicId}});
    const plans = plansQuery.data ?? [];

    return (
        <div className={section}>
            <div className={sectionHeader}>
                <div>
                    <div className={sectionTitle}>Convênios</div>
                    <div className={sectionSub}>Planos de saúde aceitos pela clínica.</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)} disabled={!clinicId}>
                    <Plus className="size-3.5" /> Novo convênio
                </Button>
            </div>

            {plans.length === 0 ? (
                <p className={emptyText}>Nenhum convênio cadastrado ainda.</p>
            ) : (
                plans.map((plan: InsurancePlan) => (
                    <div key={plan.id} className={row}>
                        <div className={rowInfo}>
                            <span className={rowName}>{plan.name}</span>
                            {plan.code && <span className={rowMeta}>{plan.code}</span>}
                        </div>
                        <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                            {plan.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </div>
                ))
            )}

            {showForm && (
                <CreateInsurancePlanDialog
                    clinicId={clinicId}
                    onClose={() => setShowForm(false)}
                    onCreated={() => plansQuery.refetch()}
                />
            )}
        </div>
    );
}

function CreateInsurancePlanDialog({
    clinicId,
    onClose,
    onCreated,
}: {
    clinicId: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    const create = useCreateInsurancePlan();
    const canSubmit = !!name && !create.isPending;

    function handleSubmit() {
        if (!canSubmit) return;

        create.mutate(
            {clinicId, data: {name, code: code || null}},
            {
                onSuccess: () => {
                    toast.success('Convênio criado');
                    onCreated();
                    onClose();
                },
                onError: (error) => toast.error(extractErrorDetail(error) ?? 'Erro ao criar convênio'),
            }
        );
    }

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo convênio</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label>Nome</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Unimed" />
                    </div>
                    <div className={formField}>
                        <Label>
                            Código <span className={sectionSub}>opcional</span>
                        </Label>
                        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="UNI-001" />
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {create.isPending ? 'Criando…' : 'Criar convênio'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
