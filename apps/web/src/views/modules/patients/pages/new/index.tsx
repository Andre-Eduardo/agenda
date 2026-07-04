import {useState, useEffect} from 'react';
import {useCreatePatient, type CreatePatientDto, CreatePatientDtoGender} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {
    Upload,
    User,
    Phone,
    MapPin,
    Activity,
    ChevronRight,
    ChevronLeft,
    Lock,
    Info,
    Check,
    Camera,
    Mail,
    Calendar,
    Sparkles,
} from 'lucide-react';
import {useForm, type SubmitHandler} from 'react-hook-form';
import {toast} from 'sonner';
import {z} from 'zod';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/componentes/breadcrumb';
import {Button} from '@/components/ui/componentes/button';
import {SectionCard as UISectionCard} from '@/components/ui/componentes/card';
import {Field, FormGrid} from '@/components/ui/componentes/field';
import {Input} from '@/components/ui/componentes/input';
import {NativeSelect} from '@/components/ui/componentes/native-select';
import {PageHeader} from '@/components/ui/componentes/page-header';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/componentes/tabs';
import {Textarea} from '@/components/ui/componentes/textarea';
import {css, cx} from '@/styled-system/css';
import {errorText, flexCol, icon11, icon14, icon22, icon3, icon35, icon4} from './styles';

export const Route = createFileRoute('/_stackedLayout/patients/new')({
    component: NewPatientPage,
});

// ── Constants ────────────────────────────────────────────────────────────────

const BR_STATES = [
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
] as const;

const TABS = [
    {key: 'identity', num: '1', label: 'Identificação', icon: User},
    {key: 'contact', num: '2', label: 'Contato', icon: Phone},
    {key: 'address', num: '3', label: 'Endereço', icon: MapPin},
    {key: 'health', num: '4', label: 'Saúde', icon: Activity},
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    documentId: z.string().min(1, 'Documento é obrigatório'),
    birthDate: z.string().optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
    emergencyContactName: z.string().optional().nullable(),
    emergencyContactPhone: z.string().optional().nullable(),
    zipCode: z.string().optional().nullable(),
    street: z.string().optional().nullable(),
    number: z.string().optional().nullable(),
    complement: z.string().optional().nullable(),
    neighborhood: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    allergies: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ── Styles ────────────────────────────────────────────────────────────────────

const pageRoot = css({
    display: 'flex',
    flexDirection: 'column',
    p: '6',
    pb: '24',
    bg: 'bg.page',
});

const aiNudgeRoot = css({
    mt: '[18px]',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '[10px]',
    borderLeftWidth: '[3px]',
    borderLeftStyle: 'solid',
    borderLeftColor: 'ai.border',
    bg: 'ai.bg',
    px: '[14px]',
    py: '3',
});

const aiNudgeIcon = css({
    display: 'inline-flex',
    w: '7',
    h: '7',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[6px]',
    bg: 'ai.badgeBg',
    color: 'white',
});

const aiNudgeBody = css({flex: '1'});

const aiNudgeTitle = css({
    display: 'flex',
    alignItems: 'center',
    gap: '[6px]',
    fontSize: 'sm',
    fontWeight: 'medium',
    lineHeight: '[1.3]',
    color: 'ai.text',
});

const aiNudgeBadge = css({
    rounded: '[4px]',
    bg: 'ai.badgeBg',
    px: '[5px]',
    py: '[1px]',
    fontSize: '[10px]',
    fontWeight: 'medium',
    letterSpacing: '[0.06em]',
    color: 'white',
});

const aiNudgeSub = css({
    mt: '0.5',
    fontSize: 'xs',
    lineHeight: '[1.5]',
    color: 'ai.text',
    opacity: '0.85',
});

const aiNudgeBtn = css({
    display: 'inline-flex',
    flexShrink: '0',
    alignItems: 'center',
    gap: '[5px]',
    rounded: '[6px]',
    bg: 'ai.badgeBg',
    px: '[11px]',
    py: '1.5',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'white',
    transitionProperty: 'color, background-color',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {bg: 'ai.border'},
});

const tabNum = css({
    display: 'inline-flex',
    w: '[22px]',
    h: '[22px]',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    fontSize: '[11px]',
    fontWeight: 'semibold',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.secondary',
});

const tabNumActive = css({borderColor: 'primary', bg: 'primary', color: 'white'});

const tabNumFilled = css({borderColor: 'success/40', bg: 'success.surface', color: 'success'});

const tabIcon = css({display: {base: 'none', sm: 'block'}, w: '[14px]', h: '[14px]'});

const sectionRoot = css({p: '7'});

const sectionHead = css({mb: '[18px]', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4'});

const sectionNum = css({
    display: 'inline-flex',
    w: '6',
    h: '6',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[6px]',
    bg: 'primary.surface',
    fontFamily: 'mono',
    fontSize: 'xs',
    fontWeight: 'medium',
    fontVariantNumeric: 'tabular-nums',
    color: 'primary.text',
});

const sectionTitle = css({
    fontSize: 'base',
    fontWeight: 'medium',
    lineHeight: '[1.3]',
    letterSpacing: '[-0.005em]',
    color: 'text.primary',
});

const sectionSub = css({mt: '0.5', fontSize: 'sm', lineHeight: '[1.4]', color: 'text.tertiary'});

const sectionInner = css({display: 'flex', alignItems: 'flex-start', gap: '3'});

const photoRoot = css({mb: '[18px]', display: 'flex', alignItems: 'center', gap: '4'});

const photoFrame = css({
    position: 'relative',
    display: 'flex',
    w: '24',
    h: '24',
    flexShrink: '0',
    cursor: 'pointer',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1',
    overflow: 'hidden',
    rounded: '[14px]',
    borderWidth: '[1.5px]',
    borderStyle: 'dashed',
    borderColor: 'border',
    bg: 'bg.surface',
    color: 'text.tertiary',
    transitionProperty: 'all',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {borderColor: 'primary', bg: 'primary.surface', color: 'primary.text'},
});

const photoText = css({
    textAlign: 'center',
    fontSize: '[11px]',
    fontWeight: 'medium',
    lineHeight: '[1.3]',
    px: '1',
});

const photoOverlay = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1',
    bg: 'black/55',
    fontSize: '[11px]',
    fontWeight: 'medium',
    color: 'white',
    opacity: '0',
    transitionProperty: 'opacity',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    '[data-photo-frame]:hover &': {opacity: '1'},
});

const photoMeta = css({display: 'flex', flexDirection: 'column', gap: '1'});

const photoTitle = css({fontSize: 'sm-body', fontWeight: 'medium', color: 'text.primary'});

const photoSub = css({fontSize: 'xs', lineHeight: '[1.4]', color: 'text.tertiary'});

const subSectionRoot = css({mt: '[18px]', rounded: '[10px]', bg: 'bg.surface', p: '4'});

const subSectionHead = css({mb: '[14px]', display: 'flex', alignItems: 'center', gap: '2'});

const subSectionTitle = css({fontSize: 'sm', fontWeight: 'medium', lineHeight: '[1.3]', color: 'text.primary'});

const subSectionTag = css({
    rounded: '[4px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '[7px]',
    py: '0.5',
    fontSize: '[11px]',
    color: 'text.tertiary',
});

const subSectionHint = css({fontSize: 'xs', color: 'text.tertiary'});

const subSectionIcon = css({w: '3.5', h: '3.5', color: 'text.secondary'});

const infoNoteIcon = css({mt: 'px', w: '[14px]', h: '[14px]', flexShrink: '0'});

const infoNote = css({
    mt: '4',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '[10px]',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'primary.border',
    bg: 'primary.surface',
    p: '3',
    fontSize: 'xs',
    lineHeight: '[1.5]',
    color: 'primary.text',
});

const footerRoot = css({
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: '30',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    bg: 'bg.card',
    px: {base: '4', lg: '8'},
    py: '[14px]',
});

const footerMeta = css({
    display: {base: 'none', md: 'flex'},
    alignItems: 'center',
    gap: '[10px]',
    fontSize: 'xs',
    lineHeight: '[1.4]',
    color: 'text.tertiary',
});

const footerStep = css({
    ml: '1',
    rounded: 'full',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    px: '[10px]',
    py: '1',
    fontSize: '[11px]',
    fontWeight: 'medium',
    letterSpacing: '[0.02em]',
    color: 'text.secondary',
});

const footerActions = css({display: 'flex', alignItems: 'center', gap: '2', flexWrap: 'wrap', justifyContent: 'flex-end'});

// ── Helpers ──────────────────────────────────────────────────────────────────

function tabHasValues(tab: TabKey, values: Partial<FormValues>): boolean {
    switch (tab) {
        case 'identity':
            return !!(values.name || values.documentId || values.birthDate || values.gender);
        case 'contact':
            return !!(values.phone || values.email || values.emergencyContactName || values.emergencyContactPhone);
        case 'address':
            return !!(values.zipCode || values.street || values.city || values.state);
        case 'health':
            return !!(values.allergies || values.notes);
        default:
            return false;
    }
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHead({num, title, subtitle}: {num: string; title: string; subtitle?: string}) {
    return (
        <div className={sectionHead}>
            <div className={sectionInner}>
                <span className={sectionNum}>{num}</span>
                <div>
                    <h2 className={sectionTitle}>{title}</h2>
                    {subtitle && <p className={sectionSub}>{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function NewPatientPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<TabKey>('identity');
    const [zipLoading, setZipLoading] = useState(false);

    const createPatient = useCreatePatient({
        mutation: {
            onSuccess: async () => {
                toast.success('Paciente cadastrado com sucesso');
                await navigate({to: '/patients'});
            },
            onError: () => {
                toast.error('Erro ao cadastrar paciente. Verifique os dados e tente novamente.');
            },
        },
    });

    const {
        register,
        handleSubmit,
        watch,
        formState: {errors},
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            documentId: '',
            birthDate: null,
            gender: null,
            phone: null,
            email: null,
            emergencyContactName: null,
            emergencyContactPhone: null,
            zipCode: null,
            street: null,
            number: null,
            complement: null,
            neighborhood: null,
            city: null,
            state: null,
            allergies: null,
            notes: null,
        },
    });

    const values = watch();

    const tabIdx = TABS.findIndex((t) => t.key === tab);
    const isFirst = tabIdx === 0;
    const isLast = tabIdx === TABS.length - 1;

    function goPrev() {
        if (!isFirst) setTab(TABS[tabIdx - 1].key);
    }

    function goNext() {
        if (!isLast) setTab(TABS[tabIdx + 1].key);
    }

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as {lucide?: {createIcons: () => void}}).lucide) {
            (window as {lucide?: {createIcons: () => void}}).lucide?.createIcons();
        }
    }, [tab]);

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        const hasAddress = data.street || data.city || data.zipCode;

        const dto: CreatePatientDto = {
            name: data.name,
            documentId: data.documentId,
            birthDate: data.birthDate || null,
            gender: (data.gender as CreatePatientDto['gender']) ?? null,
            phone: data.phone || null,
            email: data.email || null,
            emergencyContactName: data.emergencyContactName || null,
            emergencyContactPhone: data.emergencyContactPhone || null,
            address: hasAddress
                ? {
                      street: data.street || null,
                      number: data.number || null,
                      complement: data.complement || null,
                      neighborhood: data.neighborhood || null,
                      city: data.city || null,
                      state: data.state || null,
                      zipCode: data.zipCode || null,
                      country: 'BR',
                  }
                : null,
        };

        createPatient.mutate({data: dto});
    };

    const zipValue = watch('zipCode') ?? '';

    useEffect(() => {
        const digits = zipValue.replace(/\D/g, '');

        if (digits.length === 8) {
            setZipLoading(true);
            const timer = setTimeout(() => setZipLoading(false), 900);

            return () => clearTimeout(timer);
        }

        return undefined;
    }, [zipValue]);

    return (
        <div className={pageRoot}>
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <button type="button" onClick={() => navigate({to: '/patients'})}>
                                Pacientes
                            </button>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Novo paciente</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <PageHeader
                title="Novo paciente"
                subtitle="Cadastro inicial — anamnese clínica é registrada nas evoluções."
                actions={
                    <Button variant="outline" size="sm" type="button">
                        <Upload className={icon4} strokeWidth={1.5} />
                        Importar de documento
                    </Button>
                }
            />

            {/* AI nudge */}
            <div className={aiNudgeRoot}>
                <span className={aiNudgeIcon}>
                    <Sparkles className={icon35} strokeWidth={1.5} />
                </span>
                <div className={aiNudgeBody}>
                    <div className={aiNudgeTitle}>
                        <span className={aiNudgeBadge}>IA</span>
                        Acelerar cadastro
                    </div>
                    <p className={aiNudgeSub}>
                        Envie um documento (RG, CNH ou ficha) e a IA pré-preenche identificação e endereço · você revisa
                        antes de salvar.
                    </p>
                </div>
                <button type="button" className={aiNudgeBtn}>
                    <Upload className={icon3} strokeWidth={1.5} />
                    Anexar documento
                </button>
            </div>

            {/* Form card */}
            <form id="patient-form" onSubmit={handleSubmit(onSubmit)}>
                <UISectionCard>
                    <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className={flexCol}>
                        <TabsList>
                            {TABS.map((t) => {
                                const filled = tab !== t.key && tabHasValues(t.key, values);
                                const TabIcon = t.icon;

                                return (
                                    <TabsTrigger key={t.key} value={t.key}>
                                        <span className={cx(tabNum, tab === t.key && tabNumActive, filled && tabNumFilled)}>
                                            {filled ? <Check className={icon11} strokeWidth={2.5} /> : t.num}
                                        </span>
                                        <TabIcon className={tabIcon} strokeWidth={1.5} />
                                        {t.label}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {/* ── Tab 1: Identificação ─────────────────────────────── */}
                        <TabsContent value="identity">
                            <div className={sectionRoot}>
                                <SectionHead
                                    num="1"
                                    title="Identificação pessoal"
                                    subtitle="Dados básicos para criar o registro do paciente."
                                />

                                {/* Photo uploader (UI only) */}
                                <div className={photoRoot}>
                                    <div data-photo-frame className={photoFrame}>
                                        <Camera className={icon22} strokeWidth={1.5} />
                                        <span className={photoText}>Clique para adicionar foto</span>
                                        <div className={photoOverlay}>
                                            <Camera className={icon4} strokeWidth={1.5} />
                                            Alterar foto
                                        </div>
                                    </div>
                                    <div className={photoMeta}>
                                        <span className={photoTitle}>Foto do paciente</span>
                                        <span className={photoSub}>
                                            JPG ou PNG · até 5 MB · proporção 1:1 recomendada
                                        </span>
                                        <span className={cx(photoSub, css({mt: '1'}))}>
                                            Opcional · ajuda na identificação visual
                                        </span>
                                    </div>
                                </div>

                                <FormGrid>
                                    <Field label="Nome completo" required cols={8} error={errors.name?.message}>
                                        <Input
                                            {...register('name')}
                                            placeholder="Ex.: Maria Helena Souza"
                                            state={errors.name ? 'error' : 'default'}
                                        />
                                    </Field>

                                    <Field
                                        label="Documento (CPF / RG / Prontuário)"
                                        required
                                        cols={4}
                                        error={errors.documentId?.message}
                                    >
                                        <Input
                                            {...register('documentId')}
                                            placeholder="000.000.000-00"
                                            appearance="mono"
                                            state={errors.documentId ? 'error' : 'default'}
                                        />
                                    </Field>

                                    <Field label="Data de nascimento" optional cols={4}>
                                        <Input
                                            {...register('birthDate')}
                                            type="date"
                                            appearance="mono"
                                            leadIcon={<Calendar className={icon14} strokeWidth={1.5} />}
                                        />
                                    </Field>

                                    <Field label="Sexo biológico" optional cols={4}>
                                        <NativeSelect {...register('gender')}>
                                            <option value="">Selecione…</option>
                                            <option value={CreatePatientDtoGender.MALE}>Masculino</option>
                                            <option value={CreatePatientDtoGender.FEMALE}>Feminino</option>
                                            <option value={CreatePatientDtoGender.OTHER}>
                                                Outro / Prefiro não informar
                                            </option>
                                        </NativeSelect>
                                    </Field>

                                    <Field
                                        label="Nome social"
                                        optional
                                        cols={4}
                                        hint="Como o paciente prefere ser chamado."
                                    >
                                        <Input placeholder="Ex.: Helena" disabled title="Disponível em breve" />
                                    </Field>
                                </FormGrid>
                            </div>
                        </TabsContent>

                        {/* ── Tab 2: Contato ────────────────────────────────────── */}
                        <TabsContent value="contact">
                            <div className={sectionRoot}>
                                <SectionHead
                                    num="2"
                                    title="Contato"
                                    subtitle="Canais para confirmar consultas e enviar lembretes."
                                />

                                <FormGrid>
                                    <Field label="Celular / WhatsApp" required cols={4}>
                                        <Input
                                            {...register('phone')}
                                            placeholder="(00) 00000-0000"
                                            appearance="mono"
                                            leadIcon={<Phone className={icon14} strokeWidth={1.5} />}
                                        />
                                    </Field>

                                    <Field label="E-mail" optional cols={4} error={errors.email?.message}>
                                        <Input
                                            {...register('email')}
                                            type="email"
                                            placeholder="paciente@email.com"
                                            leadIcon={<Mail className={icon14} strokeWidth={1.5} />}
                                            state={errors.email ? 'error' : 'default'}
                                        />
                                    </Field>
                                </FormGrid>

                                {/* Responsável */}
                                <div className={subSectionRoot}>
                                    <div className={subSectionHead}>
                                        <User className={subSectionIcon} strokeWidth={1.5} />
                                        <h3 className={subSectionTitle}>Responsável</h3>
                                        <span className={subSectionTag}>Opcional</span>
                                        <span className={cx(subSectionHint, css({ml: '1'}))}>
                                            · para menores ou pacientes com tutela
                                        </span>
                                    </div>
                                    <FormGrid>
                                        <Field label="Nome do responsável" optional cols={5}>
                                            <Input {...register('emergencyContactName')} placeholder="Nome completo" />
                                        </Field>

                                        <Field label="Telefone" optional cols={4}>
                                            <Input
                                                {...register('emergencyContactPhone')}
                                                placeholder="(00) 00000-0000"
                                                appearance="mono"
                                            />
                                        </Field>

                                        <Field label="Relação com o paciente" optional cols={3}>
                                            <NativeSelect disabled>
                                                <option value="">Selecione…</option>
                                                <option>Mãe / Pai</option>
                                                <option>Cônjuge</option>
                                                <option>Filho(a)</option>
                                                <option>Responsável legal</option>
                                            </NativeSelect>
                                        </Field>
                                    </FormGrid>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── Tab 3: Endereço ───────────────────────────────────── */}
                        <TabsContent value="address">
                            <div className={sectionRoot}>
                                <SectionHead num="3" title="Endereço" subtitle="Todos os campos são opcionais." />

                                <FormGrid>
                                    <Field
                                        label="CEP"
                                        optional
                                        cols={3}
                                        hint={
                                            zipLoading
                                                ? 'Buscando endereço…'
                                                : 'Preenche os demais campos automaticamente.'
                                        }
                                    >
                                        <Input
                                            {...register('zipCode')}
                                            placeholder="00000-000"
                                            appearance="mono"
                                            trailIcon={
                                                zipLoading ? (
                                                        <svg
                                                            className={cx(icon14, 'animate-spin')}
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                        >
                                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                        </svg>
                                                ) : undefined
                                            }
                                        />
                                    </Field>

                                    <Field label="Logradouro" optional cols={6}>
                                        <Input
                                            {...register('street')}
                                            placeholder="Rua, avenida, travessa…"
                                            disabled={zipLoading}
                                        />
                                    </Field>

                                    <Field label="Número" optional cols={3}>
                                        <Input {...register('number')} placeholder="123" appearance="mono" />
                                    </Field>

                                    <Field label="Complemento" optional cols={4}>
                                        <Input {...register('complement')} placeholder="Apto, sala, bloco…" />
                                    </Field>

                                    <Field label="Bairro" optional cols={4}>
                                        <Input
                                            {...register('neighborhood')}
                                            placeholder="Bairro"
                                            disabled={zipLoading}
                                        />
                                    </Field>

                                    <Field label="Cidade" optional cols={3}>
                                        <Input {...register('city')} placeholder="Cidade" disabled={zipLoading} />
                                    </Field>

                                    <Field label="UF" optional cols={1}>
                                        <NativeSelect {...register('state')} disabled={zipLoading}>
                                            <option value="">—</option>
                                            {BR_STATES.map((uf) => (
                                                <option key={uf} value={uf}>
                                                    {uf}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                    </Field>
                                </FormGrid>
                            </div>
                        </TabsContent>

                        {/* ── Tab 4: Saúde ─────────────────────────────────────── */}
                        <TabsContent value="health">
                            <div className={sectionRoot}>
                                <SectionHead
                                    num="4"
                                    title="Informações de saúde"
                                    subtitle="Registro inicial — a anamnese completa é feita após o cadastro."
                                />

                                <FormGrid>
                                    <Field label="Tipo sanguíneo" optional cols={3}>
                                        <NativeSelect disabled>
                                            <option value="">Não informado</option>
                                            <option>A</option>
                                            <option>B</option>
                                            <option>AB</option>
                                            <option>O</option>
                                        </NativeSelect>
                                    </Field>

                                    <Field label="Fator Rh" optional cols={3}>
                                        <NativeSelect disabled>
                                            <option value="">Não informado</option>
                                            <option>Positivo (+)</option>
                                            <option>Negativo (−)</option>
                                        </NativeSelect>
                                    </Field>

                                    <Field
                                        label="Alergias conhecidas"
                                        optional
                                        cols={12}
                                        hint="Liste medicamentos, alimentos ou substâncias com reações documentadas."
                                    >
                                        <Textarea
                                            {...register('allergies')}
                                            placeholder="Ex.: Dipirona — reação cutânea moderada. Frutos do mar — anafilaxia."
                                        />
                                    </Field>

                                    <Field label="Observações iniciais" optional cols={12}>
                                        <Textarea
                                            {...register('notes')}
                                            placeholder="Histórico relevante, comorbidades conhecidas, medicação contínua, queixa que motivou o cadastro…"
                                        />
                                    </Field>
                                </FormGrid>

                                <div className={infoNote}>
                                    <Info className={infoNoteIcon} strokeWidth={1.5} />
                                    <div>
                                        Esses dados são apenas um registro inicial. A <strong>anamnese completa</strong>
                                        , prescrições e evoluções (SOAP) são registradas no prontuário após o cadastro.
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Sticky footer */}
                    <div className={footerRoot}>
                    <div className={footerMeta}>
                        <Lock className={icon3} strokeWidth={1.5} />
                        <span>Dados criptografados em repouso · LGPD</span>
                        <span className={footerStep}>
                            Etapa {tabIdx + 1} de {TABS.length}
                        </span>
                    </div>

                    <div className={footerActions}>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate({to: '/patients'})}
                        >
                            Cancelar
                        </Button>

                        {!isFirst && (
                            <Button type="button" variant="outline" size="sm" onClick={goPrev}>
                                <ChevronLeft className={icon4} strokeWidth={1.5} />
                                Voltar
                            </Button>
                        )}

                        {!isLast ? (
                            <Button type="button" size="sm" onClick={goNext}>
                                Avançar
                                <ChevronRight className={icon4} strokeWidth={1.5} />
                            </Button>
                        ) : (
                            <Button type="submit" form="patient-form" size="sm" disabled={createPatient.isPending}>
                                {createPatient.isPending ? (
                                    <>
                                        <svg
                                            className={cx(icon4, 'animate-spin')}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                        </svg>
                                        Salvando…
                                    </>
                                ) : (
                                    <>
                                        <User className={icon4} strokeWidth={1.5} />
                                        Salvar paciente
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    </div>
                </UISectionCard>
            </form>
        </div>
    );
}
