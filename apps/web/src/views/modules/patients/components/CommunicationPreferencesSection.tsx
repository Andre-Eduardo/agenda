import {useState} from 'react';
import {
    getGetPatientCommunicationPreferencesQueryKey,
    useGetPatientCommunicationPreferences,
    useUpdatePatientCommunicationPreference,
    type PatientChannelPreference,
} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/componentes/dialog';
import {Label} from '@/components/ui/componentes/label';
import {Textarea} from '@/components/ui/componentes/textarea';
import {useCan} from '@/hooks/useCan';
import {css} from '@/styled-system/css';

const stack = css({display: 'grid', gap: '3'});
const list = css({display: 'grid', divideY: '1px'});
const row = css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '3',
    flexWrap: 'wrap',
    py: '3',
});
const channelInfo = css({display: 'grid', gap: '1'});
const channelName = css({display: 'flex', alignItems: 'center', gap: '2', fontWeight: 'semibold'});
const muted = css({fontSize: 'sm', color: 'text.secondary'});
const historyList = css({display: 'grid', gap: '2', fontSize: 'sm', color: 'text.secondary'});
const field = css({display: 'grid', gap: '1.5', mb: '4'});

const REASON_MAX_LENGTH = 500;

function formatDateTime(value: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, {dateStyle: 'short', timeStyle: 'short'}).format(new Date(value));
}

function ChangeDialog({
    patientId,
    preference,
    onClose,
}: {
    patientId: string;
    preference: PatientChannelPreference;
    onClose: () => void;
}) {
    const {t} = useTranslation();
    const client = useQueryClient();
    const update = useUpdatePatientCommunicationPreference();
    const [reason, setReason] = useState('');
    const optingOut = !preference.optedOut;
    const channel = t(`communicationPreferences.channel.${preference.channel}`);

    async function save() {
        try {
            await update.mutateAsync({
                patientId,
                data: {channel: preference.channel, optedOut: optingOut, reason: reason.trim() || null},
            });
            await client.invalidateQueries({queryKey: getGetPatientCommunicationPreferencesQueryKey(patientId)});
            toast.success(t('states.saved'));
            onClose();
        } catch {
            toast.error(t('communicationPreferences.saveError'));
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && !update.isPending && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t(optingOut ? 'communicationPreferences.optOutTitle' : 'communicationPreferences.optInTitle', {
                            channel,
                        })}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            optingOut
                                ? 'communicationPreferences.optOutDescription'
                                : 'communicationPreferences.optInDescription'
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className={field}>
                    <Label htmlFor="communication-preference-reason">{t('communicationPreferences.reason')}</Label>
                    <Textarea
                        id="communication-preference-reason"
                        maxLength={REASON_MAX_LENGTH}
                        placeholder={t('communicationPreferences.reasonPlaceholder')}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" disabled={update.isPending} onClick={onClose}>
                        {t('actions.cancel')}
                    </Button>
                    <Button
                        type="button"
                        variant={optingOut ? 'destructive' : 'default'}
                        disabled={update.isPending}
                        onClick={save}
                    >
                        {update.isPending ? t('states.saving') : t('actions.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** LGPD (L3-04): which channels the patient accepts reminders on, with the evidence of each change. */
export function CommunicationPreferencesSection({patientId}: {patientId: string}) {
    const {t, i18n} = useTranslation();
    const canUpdate = useCan({has: 'patient:update'});
    const [editing, setEditing] = useState<PatientChannelPreference | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const query = useGetPatientCommunicationPreferences(patientId);

    if (query.isLoading) {
        return (
            <p role="status" className={muted}>
                {t('states.loading')}
            </p>
        );
    }

    if (query.isError || !query.data) {
        return (
            <p role="alert" className={muted}>
                {t('communicationPreferences.loadError')}
            </p>
        );
    }

    const {channels, history} = query.data;

    return (
        <div className={stack}>
            <p className={muted}>{t('communicationPreferences.intro')}</p>
            <ul className={list}>
                {channels.map((preference) => (
                    <li key={preference.channel} className={row}>
                        <div className={channelInfo}>
                            <span className={channelName}>
                                {t(`communicationPreferences.channel.${preference.channel}`)}
                                <Badge variant={preference.optedOut ? 'destructive' : 'secondary'}>
                                    {t(
                                        preference.optedOut
                                            ? 'communicationPreferences.optedOut'
                                            : 'communicationPreferences.allowed'
                                    )}
                                </Badge>
                            </span>
                            {preference.changedAt && preference.source && (
                                <span className={muted}>
                                    {t('communicationPreferences.changedAt', {
                                        date: formatDateTime(preference.changedAt, i18n.language),
                                        source: t(`communicationPreferences.source.${preference.source}`),
                                    })}
                                </span>
                            )}
                        </div>
                        {canUpdate && (
                            <Button variant="outline" size="sm" onClick={() => setEditing(preference)}>
                                {t(
                                    preference.optedOut
                                        ? 'communicationPreferences.optIn'
                                        : 'communicationPreferences.optOut'
                                )}
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
            {history.length > 0 && (
                <div>
                    <Button variant="link" size="sm" onClick={() => setShowHistory((value) => !value)}>
                        {t(
                            showHistory
                                ? 'communicationPreferences.hideHistory'
                                : 'communicationPreferences.showHistory',
                            {
                                count: history.length,
                            }
                        )}
                    </Button>
                    {showHistory && (
                        <ul className={historyList}>
                            {history.map((change) => (
                                <li key={change.id}>
                                    {formatDateTime(change.occurredAt, i18n.language)} ·{' '}
                                    {t(`communicationPreferences.channel.${change.channel}`)} ·{' '}
                                    {t(
                                        change.optedOut
                                            ? 'communicationPreferences.optedOut'
                                            : 'communicationPreferences.allowed'
                                    )}{' '}
                                    · {t(`communicationPreferences.source.${change.source}`)}
                                    {change.reason ? ` · “${change.reason}”` : ''}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            {editing && canUpdate && (
                <ChangeDialog patientId={patientId} preference={editing} onClose={() => setEditing(null)} />
            )}
        </div>
    );
}
