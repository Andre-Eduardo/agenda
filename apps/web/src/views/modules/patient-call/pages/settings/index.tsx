import {useState} from 'react';
import {
    getGetPatientCallAvailabilityQueryKey,
    getGetPatientCallSettingsQueryKey,
    type PatientCallPanelSettings,
    type SavePatientCallPanelDto,
    useGetPatientCallSettings,
    usePublishPatientCallLink,
    useRevokePatientCallLink,
    useSavePatientCallSettings,
} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useQueryClient} from '@tanstack/react-query';
import {createFileRoute, Link} from '@tanstack/react-router';
import {useForm, useWatch} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {z} from 'zod';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {useCanState} from '@/hooks/useCan';
import {ClinicModuleGate} from '@/views/components/ClinicModuleGate';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {Page} from '@/views/components/Page';
import {isApiError} from '@/views/components/QueryErrorHandler';
import {PatientCallDisplay} from '../../components/Display';
import styles from './styles.module.css';

function GatedPatientCallSettingsPage() {
    return (
        <ClinicModuleGate module="RECEPTION">
            <PatientCallSettingsPage />
        </ClinicModuleGate>
    );
}

export const Route = createFileRoute('/_stackedLayout/reception/panel-settings')({
    component: GatedPatientCallSettingsPage,
});

const themeSchema = z.string().regex(/^#[a-f\d]{6}$/i);
const formSchema = z.object({
    title: z.string().trim().min(1).max(80),
    message: z.string().trim().min(1).max(160),
    foregroundColor: themeSchema,
    backgroundColor: themeSchema,
    useClinicLogo: z.boolean(),
    soundEnabled: z.boolean(),
    showRecentCalls: z.boolean(),
    displaySeconds: z.number().int().min(8).max(60),
});

function PatientCallSettingsPage() {
    const {t} = useTranslation();
    const access = useCanState({has: 'patient-call:configure'});
    const settings = useGetPatientCallSettings({query: {enabled: access.allowed}});

    return (
        <Page
            title={t('patientCall.settings')}
            actions={
                <Button asChild variant="outline" size="sm">
                    <Link to="/reception">{t('reception.title')}</Link>
                </Button>
            }
        >
            {access.isLoading || (access.allowed && settings.isPending) ? <p>{t('patientCall.connecting')}</p> : null}
            {!access.isLoading && !access.allowed && <p role="alert">{t('reception.accessDenied')}</p>}
            {access.allowed && settings.isError && (
                <Button variant="outline" onClick={() => void settings.refetch()}>
                    {t('reception.retry')}
                </Button>
            )}
            {access.allowed && settings.data && <SettingsForm settings={settings.data} />}
        </Page>
    );
}

function SettingsForm({settings}: {settings: PatientCallPanelSettings}) {
    const {t} = useTranslation();
    const client = useQueryClient();
    const [confirm, setConfirm] = useState<'rotate' | 'revoke' | null>(null);
    const options = {mutation: {retry: false, onError: () => undefined}};
    const save = useSavePatientCallSettings(options);
    const publish = usePublishPatientCallLink(options);
    const revoke = useRevokePatientCallLink(options);
    const form = useForm<SavePatientCallPanelDto>({
        defaultValues: formValues(settings),
        resolver: zodResolver(formSchema),
    });
    const preview = useWatch({control: form.control});
    const link = settings.publicToken
        ? new URL(`/patient-call#${settings.publicToken}`, window.location.origin).href
        : null;
    const busy = save.isPending || publish.isPending || revoke.isPending;

    function sync(result: PatientCallPanelSettings) {
        client.setQueryData(getGetPatientCallSettingsQueryKey(), result);
        client.setQueryData(getGetPatientCallAvailabilityQueryKey(), {
            enabled: result.enabled,
            published: result.publicToken !== null,
        });
    }

    async function saveSettings(identity: SavePatientCallPanelDto) {
        try {
            const result = await save.mutateAsync({data: identity});

            sync(result);
            form.reset(formValues(result));
            toast.success(t('patientCall.saved'));
        } catch (error) {
            const status = isApiError(error) ? error.response?.status : undefined;

            toast.error(t(status === 400 ? 'patientCall.contrastError' : 'reception.actionError'));
        }
    }

    async function changeLink(action: 'publish' | 'revoke') {
        try {
            sync(await (action === 'publish' ? publish : revoke).mutateAsync());
            setConfirm(null);
            toast.success(t(action === 'publish' ? 'patientCall.published' : 'patientCall.revoked'));
        } catch {
            toast.error(t('reception.actionError'));
        }
    }

    async function copyLink() {
        if (link === null) return;

        try {
            await navigator.clipboard.writeText(link);
            toast.success(t('patientCall.copied'));
        } catch {
            toast.error(t('patientCall.copyError'));
        }
    }

    return (
        <div className={styles.layout}>
            <form className={styles.card} onSubmit={(event) => void form.handleSubmit(saveSettings)(event)}>
                <h2 className={styles.heading}>{t('patientCall.identity')}</h2>
                <label className={styles.field}>
                    {t('patientCall.titleField')}
                    <Input {...form.register('title')} required maxLength={80} />
                </label>
                <label className={styles.field}>
                    {t('patientCall.messageField')}
                    <Input {...form.register('message')} required maxLength={160} />
                </label>
                <div className={styles.colors}>
                    <label className={styles.field}>
                        {t('patientCall.foreground')}
                        <Input {...form.register('foregroundColor')} type="color" />
                    </label>
                    <label className={styles.field}>
                        {t('patientCall.background')}
                        <Input {...form.register('backgroundColor')} type="color" />
                    </label>
                </div>
                <label className={styles.field}>
                    {t('patientCall.duration')}
                    <Input
                        {...form.register('displaySeconds', {valueAsNumber: true})}
                        type="number"
                        required
                        min={8}
                        max={60}
                    />
                </label>
                <label className={styles.toggle}>
                    <input type="checkbox" {...form.register('useClinicLogo')} />
                    {t('patientCall.useLogo')}
                </label>
                <label className={styles.toggle}>
                    <input type="checkbox" {...form.register('soundEnabled')} />
                    {t('patientCall.sound')}
                </label>
                <label className={styles.toggle}>
                    <input type="checkbox" {...form.register('showRecentCalls')} />
                    {t('patientCall.showRecentCalls')}
                </label>
                {Object.keys(form.formState.errors).length > 0 && <p role="alert">{t('patientCall.invalidFields')}</p>}
                <Button disabled={busy} type="submit">
                    {t('actions.save')}
                </Button>
            </form>

            <div className={styles.card}>
                <h2 className={styles.heading}>{t('patientCall.preview')}</h2>
                <div className={styles.preview}>
                    <PatientCallDisplay
                        identity={{...settings, ...preview}}
                        logoUrl={preview.useClinicLogo ? settings.clinicLogoUrl : null}
                        call={{
                            patientName: t('patientCall.examplePatient'),
                            destination: t('patientCall.exampleDestination'),
                            expiresAt: '',
                        }}
                        recentCalls={
                            preview.showRecentCalls
                                ? [
                                      {
                                          patientName: t('patientCall.exampleRecentPatient'),
                                          destination: t('patientCall.exampleRecentDestination'),
                                      },
                                  ]
                                : []
                        }
                    />
                </div>
            </div>

            <section className={styles.linkCard}>
                <h2 className={styles.heading}>{t('patientCall.link')}</h2>
                {link ? (
                    <>
                        <Input
                            value={link}
                            aria-label={t('patientCall.link')}
                            readOnly
                            onFocus={(event) => event.currentTarget.select()}
                        />
                        <div className={styles.actions}>
                            <Button type="button" onClick={() => void copyLink()}>
                                {t('patientCall.copy')}
                            </Button>
                            <Button asChild variant="outline">
                                <a href={link} target="_blank" rel="noreferrer">
                                    {t('patientCall.open')}
                                </a>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setConfirm('rotate')}
                                disabled={busy}
                            >
                                {t('patientCall.rotate')}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setConfirm('revoke')}
                                disabled={busy}
                            >
                                {t('patientCall.revoke')}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <p>{t(settings.enabled ? 'patientCall.revokedHint' : 'patientCall.activateHint')}</p>
                        <Button type="button" disabled={busy} onClick={() => void changeLink('publish')}>
                            {t('patientCall.activate')}
                        </Button>
                    </>
                )}
            </section>

            {confirm && (
                <ConfirmDialog
                    opened
                    title={t(confirm === 'rotate' ? 'patientCall.rotate' : 'patientCall.revoke')}
                    message={t('patientCall.linkConfirmation')}
                    confirmLabel={t(confirm === 'rotate' ? 'patientCall.rotate' : 'patientCall.revoke')}
                    danger
                    isLoading={busy}
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => void changeLink(confirm === 'rotate' ? 'publish' : 'revoke')}
                />
            )}
        </div>
    );
}

function formValues(settings: PatientCallPanelSettings): SavePatientCallPanelDto {
    return {
        title: settings.title,
        message: settings.message,
        foregroundColor: settings.foregroundColor,
        backgroundColor: settings.backgroundColor,
        useClinicLogo: settings.useClinicLogo,
        soundEnabled: settings.soundEnabled,
        showRecentCalls: settings.showRecentCalls,
        displaySeconds: settings.displaySeconds,
    };
}
