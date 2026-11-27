import {useState} from 'react';
import {
    AxiosError,
    useConfigureClinicLicense,
    useGetClinicLicense,
    useSearchClinics,
    type Clinic,
    type ModuleType,
} from '@agenda-app/client';
import type {UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, Link} from '@tanstack/react-router';
import {ArrowLeft, Save} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {SegmentedControl, SegmentedControlItem} from '@/components/ui/componentes/segmented-control';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {MODULE_ICONS, MODULE_LABELS} from '@/utils/ai-modules';
import {Page} from '@/views/components/Page';
import {
    backLink,
    Card,
    cardSub,
    cardTitle,
    field,
    fieldLabel,
    fieldRow,
    footerRow,
    headerRow,
    infoGrid,
    infoLabel,
    infoValue,
    moduleIcon,
    moduleInfo,
    moduleMeta,
    moduleName,
    moduleRow,
    moduleSeats,
    presetRow,
    seatInput,
    skeletonBlock,
} from './styles';

export const Route = createFileRoute('/_stackedLayout/admin/clinics/$clinicId')({
    component: AdminClinicDetailPage,
});

const MODULE_TYPES: ModuleType[] = ['AI_CHAT', 'AI_AGENT', 'AI_FORMS', 'AI_DOCUMENT_IMPORT'];
const SEARCH_LIMIT = 500;

type ModuleForm = {
    enabled: boolean;
    includedSeats: number;
    maxSeats: number | null;
};

type ModuleFormMap = Record<ModuleType, ModuleForm>;

function emptyModuleForm(): ModuleForm {
    return {enabled: false, includedSeats: 1, maxSeats: null};
}

function emptyModuleFormMap(): ModuleFormMap {
    return {
        AI_CHAT: emptyModuleForm(),
        AI_AGENT: emptyModuleForm(),
        AI_FORMS: emptyModuleForm(),
        AI_DOCUMENT_IMPORT: emptyModuleForm(),
    };
}

const PRESETS: Array<{label: string; includedProfessionals: number; maxProfessionals: number | null}> = [
    {label: 'Consultório', includedProfessionals: 1, maxProfessionals: 1},
    {label: 'Clínica', includedProfessionals: 3, maxProfessionals: 10},
    {label: 'Clínica Plus', includedProfessionals: 10, maxProfessionals: null},
];

export function AdminClinicDetailPage() {
    const {clinicId} = Route.useParams();

    // Orval mistypes the paginated response as `never` for this overload — same known
    // codegen issue worked around for useSearchProfessionals/useSearchPatients elsewhere.
    const clinicsQuery = useSearchClinics({
        term: '',
        limit: SEARCH_LIMIT,
        cursor: null,
        sort: null,
    }) as unknown as UseQueryResult<{data: Clinic[]; totalCount: number}>;
    const clinic = clinicsQuery.data?.data.find((c) => c.id === clinicId);

    const licenseQuery = useGetClinicLicense(clinicId);
    const configureLicense = useConfigureClinicLicense();
    const license = licenseQuery.data;

    const [initialized, setInitialized] = useState(false);
    const [includedProfessionals, setIncludedProfessionals] = useState(1);
    const [maxProfessionals, setMaxProfessionals] = useState<number | null>(1);
    const [modules, setModules] = useState<ModuleFormMap>(emptyModuleFormMap());

    if (license && !initialized) {
        setIncludedProfessionals(license.professionals.included);
        setMaxProfessionals(license.professionals.max);

        const next = emptyModuleFormMap();

        for (const module of license.modules) {
            next[module.type] = {enabled: true, includedSeats: module.includedSeats, maxSeats: module.maxSeats};
        }

        setModules(next);
        setInitialized(true);
    }

    function applyPreset(preset: (typeof PRESETS)[number]) {
        setIncludedProfessionals(preset.includedProfessionals);
        setMaxProfessionals(preset.maxProfessionals);
    }

    function updateModule(type: ModuleType, patch: Partial<ModuleForm>) {
        setModules((prev) => ({...prev, [type]: {...prev[type], ...patch}}));
    }

    function handleSave() {
        configureLicense.mutate(
            {
                clinicId,
                data: {
                    includedProfessionals,
                    maxProfessionals,
                    modules: MODULE_TYPES.filter((type) => modules[type].enabled).map((type) => ({
                        type,
                        includedSeats: modules[type].includedSeats,
                        maxSeats: modules[type].maxSeats,
                    })),
                },
            },
            {
                onSuccess: () => {
                    toast.success('Licença atualizada');
                    void licenseQuery.refetch();
                },
                onError: (error) => {
                    const detail = error instanceof AxiosError ? error.response?.data?.detail : null;

                    toast.error(detail ?? 'Erro ao atualizar a licença.');
                },
            }
        );
    }

    const isLoading = clinicsQuery.isLoading || licenseQuery.isLoading;

    return (
        <Page
            title={clinic?.name ?? 'Clínica'}
            subtitle={
                <div className={headerRow}>
                    <Link to="/admin/clinics" className={backLink} aria-label="Voltar para Empresas">
                        <ArrowLeft size={16} />
                    </Link>
                    <span>Gestão de licença e pacotes de IA</span>
                </div>
            }
        >
            {isLoading && (
                <div>
                    <Skeleton className={skeletonBlock} />
                    <Skeleton className={skeletonBlock} />
                    <Skeleton className={skeletonBlock} />
                </div>
            )}

            {!isLoading && clinic && (
                <Card>
                    <div className={cardTitle}>Dados da clínica</div>
                    <div className={infoGrid}>
                        <div>
                            <div className={infoLabel}>Documento</div>
                            {/* Orval mistypes this nullable primitive as `{[key: string]: unknown} | null` — same
                                known codegen issue worked around elsewhere (e.g. UpdateClinicDto casts). */}
                            <div className={infoValue}>{(clinic.documentId as string | null) ?? '—'}</div>
                        </div>
                        <div>
                            <div className={infoLabel}>Cidade/UF</div>
                            <div className={infoValue}>
                                {[clinic.city, clinic.state].filter(Boolean).join(' - ') || '—'}
                            </div>
                        </div>
                        <div>
                            <div className={infoLabel}>Tipo</div>
                            <div className={infoValue}>
                                {clinic.accountType === 'SOLO' ? 'Autônomo (conta individual)' : 'Clínica com equipe'}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {!isLoading && license && (
                <>
                    <Card>
                        <div className={cardTitle}>Profissionais</div>
                        <p className={cardSub}>
                            {license.professionals.active} profissional(is) ativo(s) hoje nesta clínica.
                        </p>

                        <div className={presetRow}>
                            {PRESETS.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyPreset(preset)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>

                        <div className={fieldRow}>
                            <div className={field}>
                                <Label className={fieldLabel}>Profissionais incluídos</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={includedProfessionals}
                                    onChange={(e) => setIncludedProfessionals(Number(e.target.value))}
                                />
                            </div>
                            <div className={field}>
                                <Label className={fieldLabel}>Máximo</Label>
                                <div className={moduleSeats}>
                                    <SegmentedControl
                                        value={maxProfessionals === null ? 'unlimited' : 'limited'}
                                        onValueChange={(v) =>
                                            setMaxProfessionals(v === 'unlimited' ? null : includedProfessionals)
                                        }
                                    >
                                        <SegmentedControlItem value="limited">Limitado</SegmentedControlItem>
                                        <SegmentedControlItem value="unlimited">Sem limite</SegmentedControlItem>
                                    </SegmentedControl>
                                    {maxProfessionals !== null && (
                                        <Input
                                            type="number"
                                            min={includedProfessionals}
                                            value={maxProfessionals}
                                            onChange={(e) => setMaxProfessionals(Number(e.target.value))}
                                            className={seatInput}
                                            aria-label="Máximo de profissionais"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className={cardTitle}>Pacotes de IA</div>
                        <p className={cardSub}>
                            Contrate o pacote e defina quantas vagas a clínica tem para liberar profissionais.
                        </p>

                        {MODULE_TYPES.map((type) => {
                            const Icon = MODULE_ICONS[type];
                            const form = modules[type];
                            const assignedCount =
                                license.modules.find((module) => module.type === type)?.memberIds.length ?? 0;

                            return (
                                <div key={type} className={moduleRow}>
                                    <div className={moduleInfo}>
                                        <Icon size={18} className={moduleIcon} />
                                        <div>
                                            <div className={moduleName}>{MODULE_LABELS[type]}</div>
                                            {form.enabled && (
                                                <div className={moduleMeta}>
                                                    {assignedCount} profissional(is) liberado(s)
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={moduleSeats}>
                                        <SegmentedControl
                                            value={form.enabled ? 'on' : 'off'}
                                            onValueChange={(v) => updateModule(type, {enabled: v === 'on'})}
                                        >
                                            <SegmentedControlItem value="off">Não contratado</SegmentedControlItem>
                                            <SegmentedControlItem value="on">Contratado</SegmentedControlItem>
                                        </SegmentedControl>

                                        {form.enabled && (
                                            <>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={form.includedSeats}
                                                    onChange={(e) =>
                                                        updateModule(type, {includedSeats: Number(e.target.value)})
                                                    }
                                                    className={seatInput}
                                                    aria-label={`Vagas incluídas de ${MODULE_LABELS[type]}`}
                                                />
                                                <Input
                                                    type="number"
                                                    min={form.includedSeats}
                                                    value={form.maxSeats ?? ''}
                                                    placeholder="Sem limite"
                                                    onChange={(e) =>
                                                        updateModule(type, {
                                                            maxSeats:
                                                                e.target.value === '' ? null : Number(e.target.value),
                                                        })
                                                    }
                                                    className={seatInput}
                                                    aria-label={`Vagas máximas de ${MODULE_LABELS[type]}`}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <div className={footerRow}>
                            <Button onClick={handleSave} disabled={configureLicense.isPending}>
                                <Save size={14} />
                                {configureLicense.isPending ? 'Salvando…' : 'Salvar licença'}
                            </Button>
                        </div>
                    </Card>
                </>
            )}
        </Page>
    );
}
