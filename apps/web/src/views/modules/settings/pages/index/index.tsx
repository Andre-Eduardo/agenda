import {useState, useId, type ReactNode} from 'react';
import {
    AxiosError,
    useGetCurrentUser,
    useUpdateUser,
    useSearchProfessionals,
    useUpdateProfessional,
    useChangeUserPassword,
    useGetCurrentClinicMember,
    useGetClinic,
    useUpdateClinic,
    useListRooms,
    useCreateRoom,
    useUpdateRoom,
    useDeleteRoom,
    useGetSubscription,
    useGetMemberUsage,
    useGetMemberAddons,
    useGetAddonCatalog,
    useListPayments,
    useActivateSubscription,
    useChangePlan,
    useCancelSubscription,
    usePurchaseAddon,
    type Professional,
    type UpdateClinicDto,
    type UpdateProfessionalInputDto,
    type UpdateRoomInputDto,
    type ActivateSubscriptionDto,
    type AddonCatalogItem,
    type ApiProblem,
    type ChangePaymentPlanDto,
    type PurchaseAddonDto,
    type UsageMetricDto,
} from '@agenda-app/client';
import type {UseQueryResult} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {
    Briefcase,
    Calendar,
    Camera,
    Check,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    DoorOpen,
    Hospital,
    Minus,
    PackagePlus,
    KeyRound,
    Laptop,
    Lock,
    LogOut,
    MonitorSmartphone,
    Plus,
    ShieldCheck,
    Sliders,
    Smartphone,
    Sparkles,
    Trash2,
    UserRound,
} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {SegmentedControl, SegmentedControlItem} from '@/components/ui/componentes/segmented-control';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {AgendaScheduleEditor} from '@/views/components/AgendaScheduleEditor';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {
    FooterBar,
    FormCard,
    FormSection,
    PageHeading,
    PageShell,
    Placeholder,
    ProfileHeader,
    SkeletonTabContent,
    TabList,
    fieldError,
    fieldHint,
    fieldLabel,
    fieldOptional,
    fieldRequired,
    formCardP16,
    gridSpan,
    monoInput,
    mt4,
    placeholderIcon,
    pr10,
    pwdBarFill,
    pwdLabel,
    sectionSub,
    sectionTitle,
    sessionBadge,
    sessionDevice,
    sessionEndBtn,
    sessionRow,
    sessionSub,
    sessionWhen,
    shrink0,
    sideNavItem,
    skeletonH10,
    skeletonH4W48,
    tabButton,
    tabNum,
    roomAddRow,
    roomList,
    roomNameText,
    roomRow,
    planCard,
    planInfo,
    planNameText,
    planPeriodText,
    planActions,
    statusBadge,
    usageGrid,
    usageRow,
    usageRowHead,
    usageBarTrack,
    usageBarFill,
    alertBanner,
    addonGrid,
    addonCard,
    addonCardTitle,
    addonCardMeta,
    addonCardPrice,
    dataTable,
    inlineForm,
    inlineFormField,
    emptyRowText,
    dialogBody,
    summaryCard,
    summaryRow,
    summaryTotalRow,
    noteText,
    qtyStepper,
    qtyValue,
} from './styles';

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_stackedLayout/settings')({
    component: SettingsPage,
});

// ─── Constants ───────────────────────────────────────────────────────────────

const PROFESSIONS = [
    {value: 'medico', label: 'Médico', registry: 'CRM'},
    {value: 'psicologo', label: 'Psicólogo', registry: 'CRP'},
    {value: 'fisioterapeuta', label: 'Fisioterapeuta', registry: 'CREFITO'},
    {value: 'fonoaudiologo', label: 'Fonoaudiólogo', registry: 'CRFa'},
    {value: 'nutricionista', label: 'Nutricionista', registry: 'CRN'},
    {value: 'enfermeiro', label: 'Enfermeiro', registry: 'COREN'},
    {value: 'outro', label: 'Outro', registry: 'Registro'},
] as const;

const SPECIALTIES: Record<string, string[]> = {
    medico: [
        'Cardiologia',
        'Clínica geral',
        'Dermatologia',
        'Endocrinologia',
        'Gastroenterologia',
        'Geriatria',
        'Ginecologia',
        'Neurologia',
        'Ortopedia',
        'Pediatria',
        'Pneumologia',
        'Psiquiatria',
    ],
    psicologo: ['Clínica', 'Cognitivo-comportamental', 'Psicanálise', 'Neuropsicologia', 'Hospitalar'],
    fisioterapeuta: ['Ortopédica', 'Neurológica', 'Respiratória', 'Esportiva', 'RPG'],
    fonoaudiologo: ['Linguagem', 'Voz', 'Audiologia', 'Motricidade orofacial'],
    nutricionista: ['Clínica', 'Esportiva', 'Materno-infantil', 'Oncológica'],
    enfermeiro: ['UTI', 'Saúde da família', 'Centro cirúrgico'],
    outro: [],
};

const UFS = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
];

const PROFILE_TABS = [
    {key: 'identity', num: '1', label: 'Foto e identidade', icon: UserRound},
    {key: 'pro', num: '2', label: 'Dados profissionais', icon: Briefcase},
    {key: 'office', num: '3', label: 'Consultório', icon: Hospital},
    {key: 'security', num: '4', label: 'Segurança e acesso', icon: ShieldCheck},
] as const;

type TabKey = 'identity' | 'pro' | 'office' | 'security';
type Section = 'perfil' | 'agenda' | 'assinatura' | 'salas' | 'geral';

const SECTION_LABELS: Record<Section, string> = {
    perfil: 'Perfil',
    agenda: 'Agenda',
    assinatura: 'Assinatura',
    salas: 'Salas',
    geral: 'Geral',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export function SettingsPage() {
    const [section, setSection] = useState<Section>('perfil');

    return (
        <PageShell>
            {/* Breadcrumb */}
            <nav className="breadcrumb">
                <span className="crumb-link">Configurações</span>
                <span className="crumb-sep">›</span>
                <span className="crumb-current">{SECTION_LABELS[section]}</span>
            </nav>

            <div className="layout">
                {/* Side nav */}
                <aside className="side-nav">
                    <div className="nav-title">Configurações</div>
                    <button
                        type="button"
                        className={sideNavItem({active: section === 'perfil'})}
                        onClick={() => setSection('perfil')}
                    >
                        <UserRound size={15} />
                        <span>Perfil</span>
                    </button>
                    <button
                        type="button"
                        className={sideNavItem({active: section === 'agenda'})}
                        onClick={() => setSection('agenda')}
                    >
                        <Calendar size={15} />
                        <span>Agenda</span>
                    </button>
                    <button
                        type="button"
                        className={sideNavItem({active: section === 'assinatura'})}
                        onClick={() => setSection('assinatura')}
                    >
                        <CreditCard size={15} />
                        <span>Assinatura</span>
                    </button>
                    <button
                        type="button"
                        className={sideNavItem({active: section === 'salas'})}
                        onClick={() => setSection('salas')}
                    >
                        <DoorOpen size={15} />
                        <span>Salas</span>
                    </button>
                    <button
                        type="button"
                        className={sideNavItem({active: section === 'geral'})}
                        onClick={() => setSection('geral')}
                    >
                        <Sliders size={15} />
                        <span>Geral</span>
                    </button>
                </aside>

                {/* Content */}
                <div className="content">
                    {section === 'perfil' && <ProfileForm />}
                    {section === 'agenda' && <AgendaSection />}
                    {section === 'assinatura' && <SubscriptionSection />}
                    {section === 'salas' && <RoomsSection />}
                    {section === 'geral' && <GeneralSection />}
                </div>
            </div>
        </PageShell>
    );
}

// ─── General (placeholder) ───────────────────────────────────────────────────

function GeneralSection() {
    return (
        <div>
            <PageHeading>
                <h1 className="title">Geral</h1>
                <p className="sub">Preferências da aplicação, notificações e idioma.</p>
            </PageHeading>
            <FormCard className={formCardP16}>
                <Placeholder>
                    <Sliders size={28} className={placeholderIcon} />
                    <div className="ph-title">Em breve</div>
                    <div className="ph-sub">Configurações gerais serão exibidas aqui.</div>
                </Placeholder>
            </FormCard>
        </div>
    );
}

// ─── Agenda (working hours + blocks) ───────────────────────────────────────────

function AgendaSection() {
    const memberQuery = useGetCurrentClinicMember();

    return (
        <div>
            <PageHeading>
                <h1 className="title">Agenda</h1>
                <p className="sub">
                    Configure seu expediente semanal e bloqueios de agenda (férias, ausências pontuais).
                </p>
            </PageHeading>

            <FormCard>
                {memberQuery.isLoading && (
                    <SkeletonTabContent>
                        <Skeleton className={skeletonH4W48} />
                        <div className="sk-grid">
                            <Skeleton className={skeletonH10} />
                            <Skeleton className={skeletonH10} />
                        </div>
                    </SkeletonTabContent>
                )}
                {!memberQuery.isLoading && memberQuery.data && <AgendaScheduleEditor memberId={memberQuery.data.id} />}
                {!memberQuery.isLoading && !memberQuery.data && (
                    <Placeholder>
                        <div className="ph-title">Não foi possível carregar seu perfil de membro.</div>
                    </Placeholder>
                )}
            </FormCard>
        </div>
    );
}

// ─── Salas ──────────────────────────────────────────────────────────────────

function RoomsSection() {
    const memberQuery = useGetCurrentClinicMember();
    const clinicId = memberQuery.data?.clinicId;

    const clinicQuery = useGetClinic(clinicId ?? '', {query: {enabled: !!clinicId}});
    const roomManagementEnabled = clinicQuery.data?.roomManagementEnabled ?? false;

    const roomsQuery = useListRooms({query: {enabled: roomManagementEnabled}});

    const updateClinic = useUpdateClinic();
    const createRoom = useCreateRoom();
    const updateRoom = useUpdateRoom();
    const deleteRoom = useDeleteRoom();

    const [newRoomName, setNewRoomName] = useState('');

    const isLoading = memberQuery.isLoading || clinicQuery.isLoading;

    function handleToggleRoomManagement(enabled: boolean) {
        if (!clinicId) return;

        updateClinic.mutate(
            // Orval marks every field of UpdateClinicDto as required even though the API
            // accepts a partial update (same known issue as UpdateProfessionalInputDto).
            {clinicId, data: {roomManagementEnabled: enabled} as UpdateClinicDto},
            {
                onSuccess: () => {
                    toast.success(enabled ? 'Gerenciamento de salas ativado' : 'Gerenciamento de salas desativado');
                    void clinicQuery.refetch();
                },
                onError: () => toast.error('Erro ao atualizar configuração.'),
            }
        );
    }

    function handleCreateRoom() {
        if (!newRoomName.trim()) return;

        createRoom.mutate(
            {data: {name: newRoomName.trim()}},
            {
                onSuccess: () => {
                    toast.success('Sala criada');
                    setNewRoomName('');
                    void roomsQuery.refetch();
                },
                onError: () => toast.error('Erro ao criar sala.'),
            }
        );
    }

    function handleToggleRoomActive(roomId: string, active: boolean) {
        updateRoom.mutate(
            // See UpdateClinicDto cast above — same partial-update typing issue.
            {roomId, data: {active} as UpdateRoomInputDto},
            {
                onSuccess: () => void roomsQuery.refetch(),
                onError: () => toast.error('Erro ao atualizar sala.'),
            }
        );
    }

    function handleDeleteRoom(roomId: string) {
        deleteRoom.mutate(
            {roomId},
            {
                onSuccess: () => {
                    toast.success('Sala removida');
                    void roomsQuery.refetch();
                },
                onError: () => toast.error('Erro ao remover sala.'),
            }
        );
    }

    return (
        <div>
            <PageHeading>
                <h1 className="title">Salas</h1>
                <p className="sub">
                    Ative o controle de salas físicas para evitar que duas consultas usem o mesmo consultório ao mesmo
                    tempo.
                </p>
            </PageHeading>

            <FormCard>
                {isLoading ? (
                    <SkeletonTabContent>
                        <Skeleton className={skeletonH4W48} />
                        <div className="sk-grid">
                            <Skeleton className={skeletonH10} />
                            <Skeleton className={skeletonH10} />
                        </div>
                    </SkeletonTabContent>
                ) : (
                    <FormSection>
                        <div className="sec-head">
                            <span className="sec-num">1</span>
                            <div>
                                <div className={sectionTitle}>Gerenciamento de salas</div>
                                <div className={sectionSub}>
                                    Quando ativo, cada consulta pode ser vinculada a uma sala e o sistema impede dois
                                    agendamentos na mesma sala e horário.
                                </div>
                            </div>
                        </div>

                        <SegmentedControl
                            value={roomManagementEnabled ? 'on' : 'off'}
                            onValueChange={(v) => handleToggleRoomManagement(v === 'on')}
                        >
                            <SegmentedControlItem value="on">Ativado</SegmentedControlItem>
                            <SegmentedControlItem value="off">Desativado</SegmentedControlItem>
                        </SegmentedControl>

                        {roomManagementEnabled && (
                            <div className="sub-section">
                                <div className="sub-head">
                                    <DoorOpen size={14} className="sub-icon" />
                                    Salas cadastradas
                                    <span className="sub-tag">{roomsQuery.data?.length ?? 0} sala(s)</span>
                                </div>

                                <div className={roomList}>
                                    {(roomsQuery.data ?? []).length === 0 && (
                                        <p className={sectionSub}>Nenhuma sala cadastrada ainda.</p>
                                    )}
                                    {(roomsQuery.data ?? []).map((room) => (
                                        <div key={room.id} className={roomRow} role="group" aria-label={room.name}>
                                            <span className={roomNameText}>{room.name}</span>
                                            <SegmentedControl
                                                value={room.active ? 'on' : 'off'}
                                                onValueChange={(v) => handleToggleRoomActive(room.id, v === 'on')}
                                            >
                                                <SegmentedControlItem value="on">Ativa</SegmentedControlItem>
                                                <SegmentedControlItem value="off">Inativa</SegmentedControlItem>
                                            </SegmentedControl>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label="Remover sala"
                                                disabled={deleteRoom.isPending}
                                                onClick={() => handleDeleteRoom(room.id)}
                                            >
                                                <Trash2 size={13} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className={roomAddRow}>
                                    <Input
                                        placeholder="Nome da sala, ex.: Consultório 2"
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!newRoomName.trim() || createRoom.isPending}
                                        onClick={handleCreateRoom}
                                    >
                                        <Plus size={13} />
                                        Adicionar sala
                                    </Button>
                                </div>
                            </div>
                        )}
                    </FormSection>
                )}
            </FormCard>
        </div>
    );
}


// ─── Assinatura (subscription self-service) ────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
    STARTER: 'Starter',
    CONSULTORIO: 'Consultório',
    CLINICA: 'Clínica',
    ESPECIALISTA: 'Especialista',
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativa',
    TRIAL: 'Período de teste',
    SUSPENDED: 'Suspensa',
    CANCELLED: 'Cancelada',
};

const SUBSCRIPTION_STATUS_TONE: Record<string, 'ok' | 'warning' | 'danger' | 'neutral'> = {
    ACTIVE: 'ok',
    TRIAL: 'neutral',
    SUSPENDED: 'warning',
    CANCELLED: 'danger',
};

const USAGE_STATUS_TONE: Record<string, 'ok' | 'warning' | 'danger' | 'neutral'> = {
    OK: 'ok',
    WARNING: 'warning',
    EXCEEDED: 'danger',
    NOT_INCLUDED: 'neutral',
};

const USAGE_METRIC_LABELS = {
    docs: 'Documentos',
    chat: 'Mensagens de chat',
    images: 'Imagens clínicas',
    storageHotGb: 'Armazenamento (GB)',
} as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CREDIT_CARD: 'Cartão de crédito',
    PIX: 'Pix',
    BOLETO: 'Boleto',
};

function formatDate(value: string | null | undefined): string {
    if (!value) return '—';

    return new Date(value).toLocaleDateString('pt-BR');
}

function UsageMetricRow({label, metric}: {label: string; metric: UsageMetricDto}) {
    const tone = USAGE_STATUS_TONE[metric.status] ?? 'neutral';
    const limitText = metric.limit === null ? `${metric.used} (ilimitado)` : `${metric.used} / ${metric.limit}`;

    return (
        <div className={usageRow}>
            <div className={usageRowHead}>
                <span>{label}</span>
                <span>{limitText}</span>
            </div>
            <div className={usageBarTrack}>
                <div className={usageBarFill({tone})} style={{width: `${Math.min(metric.percent, 100)}%`}} />
            </div>
        </div>
    );
}

function SubscriptionSection() {
    const memberQuery = useGetCurrentClinicMember();
    const member = memberQuery.data;
    const memberId = member?.id;
    const isProfessional = member?.roles.includes('PROFESSIONAL') ?? false;

    const subscriptionQuery = useGetSubscription(memberId ?? '', {
        query: {enabled: !!memberId && isProfessional},
    });
    const hasSubscription = subscriptionQuery.isSuccess;

    const usageQuery = useGetMemberUsage(memberId ?? '', {query: {enabled: !!memberId && hasSubscription}});
    const addonsQuery = useGetMemberAddons(memberId ?? '', {query: {enabled: !!memberId && hasSubscription}});
    const catalogQuery = useGetAddonCatalog({query: {enabled: isProfessional}});
    const paymentsQuery = useListPayments(memberId ?? '', {query: {enabled: !!memberId && hasSubscription}});

    const activateSubscription = useActivateSubscription();
    const changePlan = useChangePlan();
    const cancelSubscription = useCancelSubscription();
    const purchaseAddon = usePurchaseAddon();

    const [activatePlan, setActivatePlan] = useState('CONSULTORIO');
    const [activateMethod, setActivateMethod] = useState('PIX');
    const [activateCpfCnpj, setActivateCpfCnpj] = useState('');

    const [newPlan, setNewPlan] = useState('CONSULTORIO');
    const [newMethod, setNewMethod] = useState('PIX');
    const [showChangePlan, setShowChangePlan] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [pendingAddon, setPendingAddon] = useState<AddonCatalogItem | null>(null);
    const [pendingQuantity, setPendingQuantity] = useState(1);
    const [pendingMethod, setPendingMethod] = useState('PIX');

    const isLoading = memberQuery.isLoading || (isProfessional && subscriptionQuery.isLoading);

    function handleActivate() {
        if (!memberId) return;

        activateSubscription.mutate(
            {
                memberId,
                data: {
                    planCode: activatePlan as ActivateSubscriptionDto['planCode'],
                    paymentMethod: activateMethod as ActivateSubscriptionDto['paymentMethod'],
                    ...(activateCpfCnpj.trim() ? {cpfCnpj: activateCpfCnpj.trim()} : {}),
                },
            },
            {
                onSuccess: () => {
                    toast.success('Assinatura ativada');
                    void subscriptionQuery.refetch();
                },
                onError: () => toast.error('Erro ao ativar assinatura.'),
            }
        );
    }

    function handleChangePlan() {
        if (!memberId) return;

        changePlan.mutate(
            {
                memberId,
                data: {
                    planCode: newPlan as ChangePaymentPlanDto['planCode'],
                    paymentMethod: newMethod as ChangePaymentPlanDto['paymentMethod'],
                },
            },
            {
                onSuccess: () => {
                    toast.success('Plano alterado');
                    setShowChangePlan(false);
                    void subscriptionQuery.refetch();
                    void usageQuery.refetch();
                },
                onError: () => toast.error('Erro ao alterar plano.'),
            }
        );
    }

    function handleCancel() {
        if (!memberId) return;

        cancelSubscription.mutate(
            {memberId},
            {
                onSuccess: () => {
                    toast.success('Assinatura cancelada');
                    setShowCancelConfirm(false);
                    void subscriptionQuery.refetch();
                },
                onError: () => toast.error('Erro ao cancelar assinatura.'),
            }
        );
    }

    function openAddonConfirm(addon: AddonCatalogItem) {
        setPendingAddon(addon);
        setPendingQuantity(1);
        setPendingMethod('PIX');
    }

    function handleConfirmPurchase() {
        if (!memberId || !pendingAddon) return;

        purchaseAddon.mutate(
            {
                memberId,
                data: {
                    addonCode: pendingAddon.code as PurchaseAddonDto['addonCode'],
                    quantity: pendingQuantity,
                    paymentMethod: pendingMethod as PurchaseAddonDto['paymentMethod'],
                },
            },
            {
                onSuccess: () => {
                    toast.success('Addon adquirido');
                    setPendingAddon(null);
                    void usageQuery.refetch();
                    void addonsQuery.refetch();
                    void paymentsQuery.refetch();
                },
                onError: (error) => {
                    const detail =
                        error instanceof AxiosError ? (error.response?.data as ApiProblem | undefined)?.detail : null;

                    if (detail === 'subscription.no_payment_method') {
                        toast.error('Ative um método de pagamento na sua assinatura antes de comprar addons.');

                        return;
                    }

                    toast.error('Erro ao processar a cobrança do addon.');
                },
            }
        );
    }

    if (!isLoading && !isProfessional) {
        return (
            <div>
                <PageHeading>
                    <h1 className="title">Assinatura</h1>
                    <p className="sub">Plano, uso e cobrança da sua conta profissional.</p>
                </PageHeading>
                <FormCard className={formCardP16}>
                    <Placeholder>
                        <CreditCard size={28} className={placeholderIcon} />
                        <div className="ph-title">Disponível para profissionais</div>
                        <div className="ph-sub">Assinaturas são vinculadas a membros com papel de profissional.</div>
                    </Placeholder>
                </FormCard>
            </div>
        );
    }

    const subscription = subscriptionQuery.data;
    const usage = usageQuery.data;

    return (
        <div>
            <PageHeading>
                <h1 className="title">Assinatura</h1>
                <p className="sub">Plano, uso mensal, addons e histórico de cobrança.</p>
            </PageHeading>

            <FormCard>
                {isLoading ? (
                    <SkeletonTabContent>
                        <Skeleton className={skeletonH4W48} />
                        <div className="sk-grid">
                            <Skeleton className={skeletonH10} />
                            <Skeleton className={skeletonH10} />
                        </div>
                    </SkeletonTabContent>
                ) : (
                    <FormSection>
                        <div className="sec-head">
                            <span className="sec-num">1</span>
                            <div>
                                <div className={sectionTitle}>Plano atual</div>
                                <div className={sectionSub}>Plano ativo da sua conta e opções de cobrança.</div>
                            </div>
                        </div>

                        {!subscription ? (
                            <div className={inlineForm}>
                                <div className={inlineFormField}>
                                    <Label>Plano</Label>
                                    <Select value={activatePlan} onValueChange={setActivatePlan}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PLAN_LABELS).map(([code, label]) => (
                                                <SelectItem key={code} value={code}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={inlineFormField}>
                                    <Label>Forma de pagamento</Label>
                                    <Select value={activateMethod} onValueChange={setActivateMethod}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PAYMENT_METHOD_LABELS).map(([code, label]) => (
                                                <SelectItem key={code} value={code}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={inlineFormField}>
                                    <Label>CPF/CNPJ (opcional)</Label>
                                    <Input value={activateCpfCnpj} onChange={(e) => setActivateCpfCnpj(e.target.value)} />
                                </div>
                                <Button disabled={activateSubscription.isPending} onClick={handleActivate}>
                                    Ativar assinatura
                                </Button>
                            </div>
                        ) : (
                            <div className={planCard}>
                                <div className={planInfo}>
                                    <span className={planNameText}>
                                        {PLAN_LABELS[subscription.planCode] ?? subscription.planCode}
                                    </span>
                                    <span className={planPeriodText}>
                                        {formatDate(subscription.currentPeriodStart)} –{' '}
                                        {formatDate(subscription.currentPeriodEnd)}
                                    </span>
                                </div>
                                <span
                                    className={statusBadge({
                                        tone: SUBSCRIPTION_STATUS_TONE[subscription.status] ?? 'neutral',
                                    })}
                                >
                                    {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
                                </span>
                                <div className={planActions}>
                                    <Button variant="outline" size="sm" onClick={() => setShowChangePlan(true)}>
                                        Trocar plano
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={subscription.status === 'CANCELLED'}
                                        onClick={() => setShowCancelConfirm(true)}
                                    >
                                        Cancelar assinatura
                                    </Button>
                                </div>
                            </div>
                        )}
                    </FormSection>
                )}
            </FormCard>

            <Dialog open={showChangePlan} onOpenChange={setShowChangePlan}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Trocar plano</DialogTitle>
                    </DialogHeader>
                    <div className={dialogBody}>
                        <div className={inlineFormField}>
                            <Label>Novo plano</Label>
                            <Select value={newPlan} onValueChange={setNewPlan}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PLAN_LABELS).map(([code, label]) => (
                                        <SelectItem key={code} value={code}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className={inlineFormField}>
                            <Label>Forma de pagamento</Label>
                            <Select value={newMethod} onValueChange={setNewMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PAYMENT_METHOD_LABELS).map(([code, label]) => (
                                        <SelectItem key={code} value={code}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {subscription && (
                            <p className={noteText}>
                                A cobrança atual no plano {PLAN_LABELS[subscription.planCode] ?? subscription.planCode}{' '}
                                será cancelada e uma nova cobrança do plano {PLAN_LABELS[newPlan] ?? newPlan} será
                                iniciada no método de pagamento escolhido.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowChangePlan(false)}>
                            Cancelar
                        </Button>
                        <Button disabled={changePlan.isPending} onClick={handleChangePlan}>
                            Confirmar troca
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {hasSubscription && (
                <FormCard className={mt4}>
                    <FormSection>
                        <div className="sec-head">
                            <span className="sec-num">2</span>
                            <div>
                                <div className={sectionTitle}>Uso do mês</div>
                                <div className={sectionSub}>Consumo em relação aos limites do seu plano.</div>
                            </div>
                        </div>

                        {!usage ? (
                            <SkeletonTabContent>
                                <Skeleton className={skeletonH10} />
                            </SkeletonTabContent>
                        ) : (
                            <>
                                {usage.isAnyLimitReached && (
                                    <div className={alertBanner}>
                                        Você atingiu o limite de um ou mais recursos do seu plano.
                                    </div>
                                )}
                                <div className={usageGrid}>
                                    <UsageMetricRow label={USAGE_METRIC_LABELS.docs} metric={usage.usage.docs} />
                                    <UsageMetricRow label={USAGE_METRIC_LABELS.chat} metric={usage.usage.chat} />
                                    <UsageMetricRow label={USAGE_METRIC_LABELS.images} metric={usage.usage.images} />
                                    <UsageMetricRow
                                        label={USAGE_METRIC_LABELS.storageHotGb}
                                        metric={usage.usage.storageHotGb}
                                    />
                                </div>
                            </>
                        )}
                    </FormSection>
                </FormCard>
            )}

            {hasSubscription && (
                <FormCard className={mt4}>
                    <FormSection>
                        <div className="sec-head">
                            <span className="sec-num">3</span>
                            <div>
                                <div className={sectionTitle}>Addons</div>
                                <div className={sectionSub}>Aumente os limites do seu plano com recursos extras.</div>
                            </div>
                        </div>

                        <div className="sub-section">
                            <div className="sub-head">
                                <PackagePlus size={14} className="sub-icon" />
                                Catálogo
                            </div>
                            <div className={addonGrid}>
                                {(catalogQuery.data ?? []).map((addon) => (
                                    <div key={addon.code} className={addonCard}>
                                        <span className={addonCardTitle}>{addon.name}</span>
                                        <span className={addonCardPrice}>R$ {addon.priceMonthlyBrl.toFixed(2)}/mês</span>
                                        <Button variant="outline" size="sm" onClick={() => openAddonConfirm(addon)}>
                                            Comprar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sub-section">
                            <div className="sub-head">
                                Addons ativos
                                <span className="sub-tag">{(addonsQuery.data ?? []).length} ativo(s)</span>
                            </div>
                            {(addonsQuery.data ?? []).length === 0 ? (
                                <p className={emptyRowText}>Nenhum addon ativo no momento.</p>
                            ) : (
                                <div className={addonGrid}>
                                    {(addonsQuery.data ?? []).map((addon) => (
                                        <div key={addon.code} className={addonCard}>
                                            <span className={addonCardTitle}>{addon.name}</span>
                                            <span className={addonCardMeta}>Quantidade: {addon.quantity}</span>
                                            <span className={addonCardMeta}>Expira em: {formatDate(addon.expiresAt)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </FormSection>
                </FormCard>
            )}

            {hasSubscription && (
                <FormCard className={mt4}>
                    <FormSection>
                        <div className="sec-head">
                            <span className="sec-num">4</span>
                            <div>
                                <div className={sectionTitle}>Histórico de pagamentos</div>
                                <div className={sectionSub}>Eventos de cobrança recebidos do provedor de pagamento.</div>
                            </div>
                        </div>

                        {(paymentsQuery.data ?? []).length === 0 ? (
                            <p className={emptyRowText}>Nenhum pagamento registrado ainda.</p>
                        ) : (
                            <table className={dataTable}>
                                <thead>
                                    <tr>
                                        <th>Evento</th>
                                        <th>Valor</th>
                                        <th>Status</th>
                                        <th>Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(paymentsQuery.data ?? []).map((event) => {
                                        // Orval mistypes these nullable primitives as `{[key: string]: unknown} | null`
                                        // (same known codegen issue as the Update*Dto partial-update casts above).
                                        const amount = event.amount as number | null;
                                        const processedAt = event.processedAt as string | null;

                                        return (
                                            <tr key={event.id}>
                                                <td>{event.eventType}</td>
                                                <td>{amount != null ? `R$ ${amount.toFixed(2)}` : '—'}</td>
                                                <td>{event.status}</td>
                                                <td>{formatDate(processedAt ?? event.createdAt)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </FormSection>
                </FormCard>
            )}

            <ConfirmDialog
                opened={showCancelConfirm}
                title="Cancelar assinatura"
                message="Tem certeza que deseja cancelar sua assinatura? Essa ação encerra a cobrança recorrente."
                confirmLabel="Cancelar assinatura"
                cancelLabel="Voltar"
                danger
                isLoading={cancelSubscription.isPending}
                onConfirm={handleCancel}
                onCancel={() => setShowCancelConfirm(false)}
            />

            <Dialog open={!!pendingAddon} onOpenChange={(o) => !o && setPendingAddon(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar compra de addon</DialogTitle>
                    </DialogHeader>
                    {pendingAddon && (
                        <div className={dialogBody}>
                            <div className={qtyStepper}>
                                <Label>Quantidade</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pendingQuantity <= 1}
                                    onClick={() => setPendingQuantity((q) => Math.max(1, q - 1))}
                                >
                                    <Minus size={13} />
                                </Button>
                                <span className={qtyValue}>{pendingQuantity}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPendingQuantity((q) => q + 1)}
                                >
                                    <Plus size={13} />
                                </Button>
                            </div>

                            <div className={summaryCard}>
                                <div className={summaryRow}>
                                    <span>{pendingAddon.name}</span>
                                    <span>
                                        R$ {pendingAddon.priceMonthlyBrl.toFixed(2)}/mês × {pendingQuantity}
                                    </span>
                                </div>
                                <div className={summaryTotalRow}>
                                    <span>Total mensal</span>
                                    <span>R$ {(pendingAddon.priceMonthlyBrl * pendingQuantity).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className={inlineFormField}>
                                <Label>Forma de pagamento</Label>
                                <Select value={pendingMethod} onValueChange={setPendingMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(PAYMENT_METHOD_LABELS).map(([code, label]) => (
                                            <SelectItem key={code} value={code}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <p className={noteText}>
                                Uma cobrança de R$ {(pendingAddon.priceMonthlyBrl * pendingQuantity).toFixed(2)} será
                                gerada no método selecionado e o addon é liberado assim que a cobrança for aceita pelo
                                provedor de pagamento.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingAddon(null)}>
                            Cancelar
                        </Button>
                        <Button disabled={purchaseAddon.isPending} onClick={handleConfirmPurchase}>
                            Confirmar compra
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Profile form ─────────────────────────────────────────────────────────────

function ProfileForm() {
    const [tab, setTab] = useState<TabKey>('identity');

    // Server queries
    const userQuery = useGetCurrentUser();
    const user = userQuery.data;

    const profQuery = useSearchProfessionals({
        term: '',
        limit: 1,
        cursor: null,
        sort: null,
    }) as unknown as UseQueryResult<{data: Professional[]; totalCount: number}>;

    const professional = profQuery.data?.data?.[0];

    const updateUser = useUpdateUser();
    const updateProfessional = useUpdateProfessional();
    const changePassword = useChangeUserPassword();

    // ── Identity state ──
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [identityInitialized, setIdentityInitialized] = useState(false);

    if (user && !identityInitialized) {
        setName(user.name ?? '');
        setEmail((user.email as unknown as string) ?? '');
        setIdentityInitialized(true);
    }

    // ── Professional state ──
    const [profession, setProfession] = useState('medico');
    const [specialty, setSpecialty] = useState('');
    const [registryNum, setRegistryNum] = useState('');
    const [registryUf, setRegistryUf] = useState('SP');
    const [proInitialized, setProInitialized] = useState(false);

    if (professional && !proInitialized) {
        const rawSpecialty = (professional.specialty as string | null) ?? '';

        setSpecialty(rawSpecialty);
        setRegistryNum((professional.registrationNumber as string | null) ?? '');
        setProInitialized(true);
    }

    // ── Office state ──
    const [officeName, setOfficeName] = useState('');
    const [officePhone, setOfficePhone] = useState('');
    const [officeCep, setOfficeCep] = useState('');
    const [officeStreet, setOfficeStreet] = useState('');
    const [officeNumber, setOfficeNumber] = useState('');
    const [officeComp, setOfficeComp] = useState('');
    const [officeNeigh, setOfficeNeigh] = useState('');
    const [officeCity, setOfficeCity] = useState('');
    const [officeUf, setOfficeUf] = useState('SP');
    const [cepLoading, setCepLoading] = useState(false);

    // ── Security state ──
    const [curPwd, setCurPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const pwdStrength = (() => {
        if (!newPwd) return null;
        let s = 0;

        if (newPwd.length >= 8) s++;

        if (/\d/.test(newPwd)) s++;

        if (/[^A-Za-z0-9]/.test(newPwd)) s++;

        if (/[A-Z]/.test(newPwd) && /[a-z]/.test(newPwd)) s++;

        if (s <= 1) return {level: 'weak' as const, label: 'Fraca', pct: 30};

        if (s === 2) return {level: 'med' as const, label: 'Média', pct: 60};

        return {level: 'strong' as const, label: 'Forte', pct: 100};
    })();
    const pwdMatch = !!(newPwd && confirmPwd && newPwd === confirmPwd);
    const canChangePwd = !!(curPwd && newPwd && confirmPwd && pwdMatch && pwdStrength?.level !== 'weak');

    // ── Tab navigation ──
    const tabIdx = PROFILE_TABS.findIndex((t) => t.key === tab);
    const isFirst = tabIdx === 0;
    const isLast = tabIdx === PROFILE_TABS.length - 1;
    const goPrev = () => setTab(PROFILE_TABS[Math.max(0, tabIdx - 1)].key);
    const goNext = () => setTab(PROFILE_TABS[Math.min(PROFILE_TABS.length - 1, tabIdx + 1)].key);

    const tabFilled: Record<TabKey, boolean> = {
        identity: !!(name && email),
        pro: !!(profession && registryNum && registryUf),
        office: !!(officeName || officeCep),
        security: !!curPwd,
    };

    const profDef = PROFESSIONS.find((p) => p.value === profession);
    const specOptions = SPECIALTIES[profession] ?? [];

    // ── Save handlers ──
    const isSaving = updateUser.isPending || updateProfessional.isPending;

    function handleSave() {
        // Professional data (specialty, registration) — no password needed
        if (professional) {
            const dto: UpdateProfessionalInputDto = {
                registrationNumber: registryNum || null,
                specialty: specialty || null,
                specialtyNormalized: null,
                defaultRoomId: professional.defaultRoomId ?? null,
            };

            updateProfessional.mutate(
                {id: professional.id, data: dto},
                {
                    onSuccess: () =>
                        toast.success('Perfil atualizado', {
                            description: specialty ? `Agente IA: ${specialty}` : 'Alterações salvas.',
                        }),
                    onError: () => toast.error('Erro ao salvar dados profissionais.'),
                }
            );
        } else {
            // No professional record yet — just confirm save of other tabs
            toast.success('Alterações salvas');
        }
    }

    function handleChangePassword() {
        changePassword.mutate(
            {data: {oldPassword: curPwd, newPassword: newPwd}},
            {
                onSuccess: () => {
                    toast.success('Senha alterada com sucesso');
                    setCurPwd('');
                    setNewPwd('');
                    setConfirmPwd('');
                },
                onError: () => toast.error('Erro ao alterar senha. Verifique a senha atual.'),
            }
        );
    }

    const isLoading = userQuery.isLoading || profQuery.isLoading;

    return (
        <div>
            <ProfileHeader>
                <PageHeading>
                    <h1 className="title">Perfil do profissional</h1>
                    <p className="sub">
                        Seus dados profissionais são usados para personalizar o sistema e selecionar o agente de IA
                        adequado para seus atendimentos.
                    </p>
                </PageHeading>
            </ProfileHeader>

            <FormCard>
                {/* Tab bar */}
                <TabList>
                    {PROFILE_TABS.map((t, _i) => {
                        const active = t.key === tab;
                        const filled = tabFilled[t.key] && !active;
                        const Icon = t.icon;

                        return (
                            <button
                                type="button"
                                key={t.key}
                                className={tabButton({active})}
                                onClick={() => setTab(t.key)}
                            >
                                <span className={tabNum({active, filled})}>{filled ? <Check size={10} /> : t.num}</span>
                                <Icon size={14} className={shrink0} />
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </TabList>

                {/* Tab content */}
                {isLoading ? (
                    <SkeletonTabContent>
                        <Skeleton className={skeletonH4W48} />
                        <div className="sk-grid">
                            <Skeleton className={skeletonH10} />
                            <Skeleton className={skeletonH10} />
                        </div>
                    </SkeletonTabContent>
                ) : (
                    <>
                        {/* ─── 1. Identity ─── */}
                        {tab === 'identity' && (
                            <FormSection>
                                <div className="sec-head">
                                    <span className="sec-num">1</span>
                                    <div>
                                        <div className={sectionTitle}>Foto e identidade</div>
                                        <div className={sectionSub}>
                                            Como você aparece no sistema e suas credenciais de acesso.
                                        </div>
                                    </div>
                                </div>

                                {/* Photo */}
                                <div className="photo-row">
                                    <div className="circle">
                                        <span className="initials">
                                            {name
                                                ? name
                                                      .split(' ')
                                                      .map((w) => w[0])
                                                      .slice(0, 2)
                                                      .join('')
                                                      .toUpperCase()
                                                : '—'}
                                        </span>
                                    </div>
                                    <div className="photo-actions">
                                        <Button variant="outline" size="sm">
                                            <Camera size={13} />
                                            Alterar foto
                                        </Button>
                                        <p className="photo-hint">JPG ou PNG · até 5 MB · proporção 1:1</p>
                                    </div>
                                </div>

                                <div className="grid-12">
                                    <Field label="Nome completo" required span={6}>
                                        <Input
                                            placeholder="Nome completo"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </Field>
                                    <Field label="E-mail" required span={6} hint="É o e-mail de acesso ao sistema.">
                                        <Input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </Field>
                                </div>
                            </FormSection>
                        )}

                        {/* ─── 2. Professional data ─── */}
                        {tab === 'pro' && (
                            <FormSection>
                                <div className="sec-head">
                                    <span className="sec-num">2</span>
                                    <div>
                                        <div className={sectionTitle}>Dados profissionais</div>
                                        <div className={sectionSub}>
                                            Definem sua identidade clínica e o agente de IA usado nos atendimentos.
                                        </div>
                                    </div>
                                </div>

                                <div className="grid-12">
                                    <Field label="Profissão" required span={6}>
                                        <Select
                                            value={profession}
                                            onValueChange={(val) => {
                                                setProfession(val);
                                                setSpecialty(SPECIALTIES[val]?.[0] ?? '');
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PROFESSIONS.map((p) => (
                                                    <SelectItem key={p.value} value={p.value}>
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field
                                        label="Especialidade"
                                        required={specOptions.length > 0}
                                        optional={specOptions.length === 0}
                                        span={6}
                                    >
                                        {specOptions.length > 0 ? (
                                            <Select value={specialty} onValueChange={setSpecialty}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {specOptions.map((s) => (
                                                        <SelectItem key={s} value={s}>
                                                            {s}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                placeholder="Ex.: Acupuntura"
                                                value={specialty}
                                                onChange={(e) => setSpecialty(e.target.value)}
                                            />
                                        )}
                                    </Field>

                                    <Field
                                        label={`Número de registro · ${profDef?.registry ?? 'Registro'}`}
                                        required
                                        span={8}
                                    >
                                        <Input
                                            className={monoInput}
                                            placeholder={profDef?.registry === 'CRM' ? 'Ex.: 84321' : 'Número'}
                                            value={registryNum}
                                            onChange={(e) => setRegistryNum(e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Estado" required span={4}>
                                        <Select value={registryUf} onValueChange={setRegistryUf}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="UF" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {UFS.map((u, i) => (
                                                    <SelectItem key={`${u}-${i}`} value={u}>
                                                        {u}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>

                                {/* AI nudge */}
                                <div className="ai-nudge">
                                    <Sparkles size={14} className="ai-icon" />
                                    <div>
                                        <div className="ai-title">
                                            <span className="ai-badge">IA</span>
                                            Agente clínico ativo:{' '}
                                            <span className="agent-name">{specialty || 'Clínica geral'}</span>
                                        </div>
                                        <p className="ai-sub">
                                            Profissão e especialidade definem qual agente de IA é ativado no chat
                                            clínico dos pacientes. Revise se o agente exibido não corresponder à sua
                                            atuação.
                                        </p>
                                    </div>
                                </div>
                            </FormSection>
                        )}

                        {/* ─── 3. Office ─── */}
                        {tab === 'office' && (
                            <FormSection>
                                <div className="sec-head">
                                    <span className="sec-num">3</span>
                                    <div>
                                        <div className={sectionTitle}>Dados do consultório</div>
                                        <div className={sectionSub}>
                                            Informações do local de atendimento — todos os campos são opcionais.
                                        </div>
                                    </div>
                                </div>

                                <div className="grid-12">
                                    <Field label="Nome do consultório ou clínica" optional span={8}>
                                        <Input
                                            placeholder="Ex.: Clínica Espaço Saúde"
                                            value={officeName}
                                            onChange={(e) => setOfficeName(e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Telefone de contato" optional span={4}>
                                        <Input
                                            className={monoInput}
                                            placeholder="(00) 0000-0000"
                                            value={officePhone}
                                            onChange={(e) => setOfficePhone(e.target.value)}
                                        />
                                    </Field>
                                    <Field
                                        label="CEP"
                                        optional
                                        span={3}
                                        hint={cepLoading ? 'Buscando endereço…' : 'Preenche os demais campos.'}
                                    >
                                        <Input
                                            className={monoInput}
                                            placeholder="00000-000"
                                            value={officeCep}
                                            onChange={(e) => {
                                                setOfficeCep(e.target.value);

                                                if (e.target.value.replace(/\D/g, '').length === 8) {
                                                    setCepLoading(true);
                                                    setTimeout(() => setCepLoading(false), 700);
                                                }
                                            }}
                                        />
                                    </Field>
                                    <Field label="Logradouro" optional span={6}>
                                        <Input
                                            placeholder="Rua, avenida, travessa…"
                                            value={officeStreet}
                                            onChange={(e) => setOfficeStreet(e.target.value)}
                                            disabled={cepLoading}
                                        />
                                    </Field>
                                    <Field label="Número" optional span={3}>
                                        <Input
                                            className={monoInput}
                                            placeholder="123"
                                            value={officeNumber}
                                            onChange={(e) => setOfficeNumber(e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Complemento" optional span={4}>
                                        <Input
                                            placeholder="Sala, conj., bloco"
                                            value={officeComp}
                                            onChange={(e) => setOfficeComp(e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Bairro" optional span={4}>
                                        <Input
                                            placeholder="Bairro"
                                            value={officeNeigh}
                                            onChange={(e) => setOfficeNeigh(e.target.value)}
                                            disabled={cepLoading}
                                        />
                                    </Field>
                                    <Field label="Cidade" optional span={3}>
                                        <Input
                                            placeholder="Cidade"
                                            value={officeCity}
                                            onChange={(e) => setOfficeCity(e.target.value)}
                                            disabled={cepLoading}
                                        />
                                    </Field>
                                    <Field label="UF" optional span={1}>
                                        <Select value={officeUf} onValueChange={setOfficeUf} disabled={cepLoading}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="—" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {UFS.map((u, i) => (
                                                    <SelectItem key={`${u}-${i}`} value={u}>
                                                        {u}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>
                            </FormSection>
                        )}

                        {/* ─── 4. Security ─── */}
                        {tab === 'security' && (
                            <FormSection>
                                <div className="sec-head">
                                    <span className="sec-num">4</span>
                                    <div>
                                        <div className={sectionTitle}>Segurança e acesso</div>
                                        <div className={sectionSub}>
                                            Gerenciamento das credenciais e sessões abertas.
                                        </div>
                                    </div>
                                </div>

                                {/* Change password */}
                                <div className="sub-section">
                                    <div className="sub-head">
                                        <KeyRound size={14} className="sub-icon" />
                                        Redefinir senha
                                    </div>
                                    <div className="grid-12">
                                        <Field label="Senha atual" required span={4}>
                                            <div className="pwd-wrap">
                                                <Input
                                                    type={showPwd ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    value={curPwd}
                                                    onChange={(e) => setCurPwd(e.target.value)}
                                                    className={pr10}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPwd((v) => !v)}
                                                    className="reveal"
                                                    aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                                                >
                                                    {showPwd ? '🙈' : '👁'}
                                                </button>
                                            </div>
                                        </Field>

                                        <Field
                                            label="Nova senha"
                                            required
                                            span={4}
                                            hint="Mín. 8 caracteres com número e símbolo."
                                        >
                                            <Input
                                                type={showPwd ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={newPwd}
                                                onChange={(e) => setNewPwd(e.target.value)}
                                            />
                                            {pwdStrength && (
                                                <div className="pwd-meter">
                                                    <div className="pwd-bar">
                                                        <div
                                                            className={pwdBarFill({level: pwdStrength.level})}
                                                            style={{width: `${pwdStrength.pct}%`}}
                                                        />
                                                    </div>
                                                    <span className={pwdLabel({level: pwdStrength.level})}>
                                                        {pwdStrength.label}
                                                    </span>
                                                </div>
                                            )}
                                        </Field>

                                        <Field
                                            label="Confirmar nova senha"
                                            required
                                            span={4}
                                            error={confirmPwd && !pwdMatch ? 'As senhas não coincidem' : undefined}
                                        >
                                            <Input
                                                type={showPwd ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={confirmPwd}
                                                onChange={(e) => setConfirmPwd(e.target.value)}
                                                className={confirmPwd && !pwdMatch ? 'border-(--color-warning)' : ''}
                                            />
                                        </Field>
                                    </div>
                                    <div className={mt4}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!canChangePwd || changePassword.isPending}
                                            onClick={handleChangePassword}
                                        >
                                            <KeyRound size={13} />
                                            {changePassword.isPending ? 'Alterando…' : 'Alterar senha'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Sessions */}
                                <div className="sub-section">
                                    <div className="sub-head">
                                        <MonitorSmartphone size={14} className="sub-icon" />
                                        Sessões ativas
                                        <span className="sub-tag">3 sessões</span>
                                    </div>
                                    <div className="session-list">
                                        <SessionRow
                                            current
                                            device="MacBook Pro"
                                            os="macOS · Chrome"
                                            loc="São Paulo, SP"
                                            when="Agora"
                                        />
                                        <SessionRow
                                            device="iPhone 15"
                                            os="iOS · Safari"
                                            loc="São Paulo, SP"
                                            when="Há 2 horas"
                                        />
                                        <SessionRow
                                            device="iPad Air"
                                            os="iPadOS · App"
                                            loc="Campinas, SP"
                                            when="Ontem, 18:42"
                                        />
                                    </div>
                                    <div className={mt4}>
                                        <Button variant="outline" size="sm">
                                            <LogOut size={13} />
                                            Encerrar todas as outras sessões
                                        </Button>
                                    </div>
                                </div>
                            </FormSection>
                        )}
                    </>
                )}
            </FormCard>

            {/* Footer */}
            <FooterBar>
                <div className="meta">
                    <Lock size={11} />
                    <span>Dados criptografados em repouso · LGPD</span>
                    <span className="step">
                        Etapa {tabIdx + 1} de {PROFILE_TABS.length}
                    </span>
                </div>
                <div className="actions">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Cancelar
                    </Button>
                    {!isFirst && (
                        <Button variant="outline" onClick={goPrev}>
                            <ChevronLeft size={14} />
                            Voltar
                        </Button>
                    )}
                    {!isLast && (
                        <Button onClick={goNext}>
                            Avançar
                            <ChevronRight size={14} />
                        </Button>
                    )}
                    {isLast && (
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Check size={14} />
                            {isSaving ? 'Salvando…' : 'Salvar alterações'}
                        </Button>
                    )}
                </div>
            </FooterBar>
        </div>
    );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Field({
    label,
    children,
    span = 6,
    required,
    optional,
    hint,
    error,
}: {
    label: string;
    children: ReactNode;
    span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    required?: boolean;
    optional?: boolean;
    hint?: string;
    error?: string;
}) {
    const id = useId();

    return (
        <div className={gridSpan(span)}>
            <Label htmlFor={id} className={fieldLabel}>
                {label}
                {required && <span className={fieldRequired}>*</span>}
                {optional && <span className={fieldOptional}>(opcional)</span>}
            </Label>
            <div id={id}>{children}</div>
            {hint && !error && <p className={fieldHint}>{hint}</p>}
            {error && <p className={fieldError}>{error}</p>}
        </div>
    );
}

function SessionRow({
    current,
    device,
    os,
    loc,
    when,
}: {
    current?: boolean;
    device: string;
    os: string;
    loc: string;
    when: string;
}) {
    const isPhone = device.includes('iPhone') || device.includes('iPad');
    const Icon = isPhone ? Smartphone : Laptop;

    return (
        <div className={sessionRow({current})}>
            <div className="session-icon">
                <Icon size={17} />
            </div>
            <div className="session-name-cell">
                <div className={sessionDevice}>
                    {device}
                    {current && <span className={sessionBadge}>Esta sessão</span>}
                </div>
                <div className={sessionSub}>
                    {os} · {loc}
                </div>
            </div>
            <div className={sessionWhen}>{when}</div>
            {!current && (
                <Button variant="ghost" size="sm" className={sessionEndBtn}>
                    <LogOut size={13} />
                    Encerrar
                </Button>
            )}
        </div>
    );
}
