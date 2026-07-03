import {useState, useEffect} from 'react';
import {
    useGetPatient,
    useUpdatePatient,
    type UpdatePatientInputDto,
    type Patient,
    UpdatePatientInputDtoGender,
} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {
    User,
    Phone,
    MapPin,
    Activity,
    ChevronRight,
    ChevronLeft,
    Lock,
    Info,
    Check,
    Mail,
    Calendar,
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
import {Input, inputVariants} from '@/components/ui/componentes/input';
import {NativeSelect} from '@/components/ui/componentes/native-select';
import {PageHeader} from '@/components/ui/componentes/page-header';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/componentes/tabs';
import {Textarea} from '@/components/ui/componentes/textarea';
import {css, cx} from '@/styled-system/css';
import {errorText, flexCol, icon11, icon14, icon3, icon4, mb4, skeletonH4W48, skeletonH8W64} from './styles';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/edit')({
    component: EditPatientPage,
});

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
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

const pageRoot = css({display: 'flex', flexDirection: 'column', p: '6', pb: '24', bg: 'bg.page'});

const pageSkeletonStack = css({display: 'flex', flexDirection: 'column', gap: '4', p: '6'});

const pageSkeletonCard400 = css({h: '[400px]', rounded: 'card'});

const pageErrorState = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4',
    p: '12',
    color: 'text.secondary',
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
    gap: '4',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    bg: 'bg.card',
    px: '8',
    py: '[14px]',
});

const footerMeta = css({
    display: 'flex',
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

const footerActions = css({display: 'flex', alignItems: 'center', gap: '[10px]'});

// ── Helpers ───────────────────────────────────────────────────────────────────

function asStr(v: unknown): string | null {
    return typeof v === 'string' && v ? v : null;
}

function toNullableStr(v: unknown): string | null {
    return typeof v === 'string' ? v : null;
}

function tabHasValues(tab: TabKey, values: Partial<FormValues>): boolean {
    switch (tab) {
        case 'identity':
            return !!(values.name || values.birthDate || values.gender);
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

// ── Section header ─────────────────────────────────────────────────────────────

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

// ── Route component ───────────────────────────────────────────────────────────

export function EditPatientPage() {
    const {patientId} = Route.useParams();
    const navigate = useNavigate();
    const {data: patient, isLoading, isError} = useGetPatient(patientId);

    if (isLoading) {
        return (
            <div className={pageSkeletonStack}>
                <Skeleton className={skeletonH4W48} />
                <Skeleton className={skeletonH8W64} />
                <Skeleton className={pageSkeletonCard400} />
            </div>
        );
    }

    if (isError || !patient) {
        return (
            <div className={pageErrorState}>
                <p className={errorText}>Paciente não encontrado.</p>
                <Button variant="outline" size="sm" onClick={() => navigate({to: '/patients'})}>
                    Voltar
                </Button>
            </div>
        );
    }

    return <EditPatientForm patient={patient} />;
}

// ── Form ──────────────────────────────────────────────────────────────────────

function EditPatientForm({patient}: {patient: Patient}) {
    const navigate = useNavigate();
    const [tab, setTab] = useState<TabKey>('identity');
    const [zipLoading, setZipLoading] = useState(false);

    const addr = patient.address;

    const updatePatient = useUpdatePatient({
        mutation: {
            onSuccess: async () => {
                toast.success('Cadastro atualizado com sucesso');
                await navigate({
                    to: '/patients/$patientId',
                    params: {patientId: patient.id},
                });
            },
            onError: () => {
                toast.error('Erro ao salvar alterações. Verifique os dados e tente novamente.');
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
            name: asStr(patient.name) ?? '',
            birthDate: asStr(patient.birthDate),
            gender: (patient.gender as 'MALE' | 'FEMALE' | 'OTHER' | null) ?? null,
            phone: asStr(patient.phone),
            email: asStr(patient.email),
            emergencyContactName: asStr(patient.emergencyContactName),
            emergencyContactPhone: asStr(patient.emergencyContactPhone),
            zipCode: addr ? asStr(addr.zipCode) : null,
            street: addr ? asStr(addr.street) : null,
            number: addr ? asStr(addr.number) : null,
            complement: addr ? asStr(addr.complement) : null,
            neighborhood: addr ? asStr(addr.neighborhood) : null,
            city: addr ? asStr(addr.city) : null,
            state: addr ? asStr(addr.state) : null,
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

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        const hasAddress = data.street || data.city || data.zipCode;

        const dto: UpdatePatientInputDto = {
            name: data.name,
            birthDate: data.birthDate || null,
            gender: (data.gender as UpdatePatientInputDto['gender']) ?? null,
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
            insurancePlanId: toNullableStr(patient.insurancePlanId),
            insuranceCardNumber: toNullableStr(patient.insuranceCardNumber),
            insuranceValidUntil: toNullableStr(patient.insuranceValidUntil),
        };

        updatePatient.mutate({id: patient.id, data: dto});
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

    function goBack() {
        void navigate({to: '/patients/$patientId', params: {patientId: patient.id}});
    }

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
                        <BreadcrumbLink asChild>
                            <button type="button" onClick={goBack}>
                                {patient.name}
                            </button>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Editar</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <PageHeader title="Editar paciente" subtitle="Atualize os dados administrativos e iniciais do paciente." />

            {/* Form card */}
            <form id="edit-patient-form" onSubmit={handleSubmit(onSubmit)}>
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

                        {/* ── Tab 1: Identificação ──────────────────────────── */}
                        <TabsContent value="identity">
                            <div className={sectionRoot}>
                                <SectionHead
                                    num="1"
                                    title="Identificação pessoal"
                                    subtitle="Dados básicos do paciente."
                                />

                                {/* Document ID — read-only after creation */}
                                <Field
                                    label="Documento (CPF / RG / Prontuário)"
                                    cols={12}
                                    hint="O documento não pode ser alterado após o cadastro."
                                className={mb4}
                            >
                                <div
                                    className={cx(
                                        inputVariants({appearance: 'mono'}),
                                        css({cursor: 'not-allowed', bg: 'bg.surface', color: 'text.secondary'})
                                    )}
                                >
                                    {patient.documentId}
                                </div>
                            </Field>


                                <FormGrid>
                                    <Field label="Nome completo" required cols={8} error={errors.name?.message}>
                                        <Input
                                            {...register('name')}
                                            placeholder="Ex.: Maria Helena Souza"
                                            state={errors.name ? 'error' : 'default'}
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
                                            <option value={UpdatePatientInputDtoGender.MALE}>Masculino</option>
                                            <option value={UpdatePatientInputDtoGender.FEMALE}>Feminino</option>
                                            <option value={UpdatePatientInputDtoGender.OTHER}>
                                                Outro / Prefiro não informar
                                            </option>
                                        </NativeSelect>
                                    </Field>
                                </FormGrid>
                            </div>
                        </TabsContent>

                        {/* ── Tab 2: Contato ─────────────────────────────────── */}
                        <TabsContent value="contact">
                            <div className={sectionRoot}>
                                <SectionHead
                                    num="2"
                                    title="Contato"
                                    subtitle="Canais para confirmar consultas e enviar lembretes."
                                />

                                <FormGrid>
                                    <Field label="Celular / WhatsApp" optional cols={4}>
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
                                    </FormGrid>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── Tab 3: Endereço ───────────────────────────────── */}
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

                        {/* ── Tab 4: Saúde ──────────────────────────────────── */}
                        <TabsContent value="health">
                            <div className={sectionRoot}>
                                <SectionHead
                                    num="4"
                                    title="Informações de saúde"
                                    subtitle="Registro inicial — a anamnese completa é feita após o cadastro."
                                />

                                <FormGrid>
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
                            <Button type="button" variant="outline" size="sm" onClick={goBack}>
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
                                <Button
                                    type="submit"
                                    form="edit-patient-form"
                                    size="sm"
                                    disabled={updatePatient.isPending}
                                >
                                    {updatePatient.isPending ? (
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
                                            <Check className={icon4} strokeWidth={1.5} />
                                            Salvar alterações
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
