import {useState} from 'react';
import {useGetClinicalProfile, useSearchPatientAlerts} from '@agenda-app/client';
import {TriangleAlert} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/componentes/button';
import {useCan} from '@/hooks/useCan';
import {css} from '@/styled-system/css';

export const SUMMARY_FIELDS = ['allergies', 'chronicConditions', 'currentMedications'] as const;
export const PROFILE_FIELDS = [
    ...SUMMARY_FIELDS,
    'surgicalHistory',
    'familyHistory',
    'socialHistory',
    'generalNotes',
] as const;
export const ALERT_PAGE_SIZE = 10;

const stack = css({display: 'grid', gap: '3'});
const summary = css({display: 'grid', gap: '2', fontSize: 'sm'});
const heading = css({display: 'flex', gap: '2', alignItems: 'center', fontWeight: 'semibold'});
const warning = css({
    display: 'grid',
    gap: '2',
    p: '3',
    border: '1px solid',
    borderColor: 'red.300',
    bg: 'bg.card',
    color: 'red.700',
    borderRadius: 'lg',
    fontSize: 'sm',
    overflowWrap: 'anywhere',
});
const alertItems = css({display: 'grid', gap: '2'});
const multiline = css({whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'});
const muted = css({fontSize: 'sm', color: 'text.secondary'});
const pagination = css({display: 'flex', gap: '2', alignItems: 'center', flexWrap: 'wrap'});

export function usePatientClinicalPreview(patientId: string, canRead: boolean, page: number) {
    const canViewProfile = useCan({has: 'clinical-profile:view'}) && canRead;
    const canViewAlerts = useCan({has: 'patient-alert:view'}) && canRead;
    const profile = useGetClinicalProfile(patientId, {query: {enabled: canViewProfile}});
    const alerts = useSearchPatientAlerts(
        patientId,
        {limit: ALERT_PAGE_SIZE, page, severity: 'HIGH', isActive: 'true'},
        {query: {enabled: canViewAlerts}}
    );

    return {
        profile: canViewProfile && !profile.isError ? profile.data : undefined,
        alerts: canViewAlerts && !alerts.isError ? alerts.data : undefined,
        canViewAlerts,
        isLoading: (canViewProfile && profile.isLoading) || (canViewAlerts && alerts.isLoading),
        isError: (canViewProfile && profile.isError) || (canViewAlerts && alerts.isError),
    };
}

export function ClinicalPagination({
    page,
    totalCount,
    onPage,
}: {
    page: number;
    totalCount: number;
    onPage: (page: number) => void;
}) {
    const {t} = useTranslation();

    if (page === 1 && totalCount <= ALERT_PAGE_SIZE) return null;

    return (
        <div className={pagination}>
            <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                {t('clinicalData.previousPage')}
            </Button>
            <span>{t('clinicalData.page', {page})}</span>
            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page * ALERT_PAGE_SIZE >= totalCount}
                onClick={() => onPage(page + 1)}
            >
                {t('clinicalData.nextPage')}
            </Button>
        </div>
    );
}

export function PatientClinicalPreviewContent({
    clinical,
    page,
    onPage,
    showEmpty = false,
}: {
    clinical: ReturnType<typeof usePatientClinicalPreview>;
    page: number;
    onPage: (page: number) => void;
    showEmpty?: boolean;
}) {
    const {t} = useTranslation();
    const {profile, alerts} = clinical;
    const fields = SUMMARY_FIELDS.filter((field) => profile?.[field]?.trim());

    if (!clinical.isLoading && !clinical.isError && fields.length === 0 && !alerts?.totalCount && !showEmpty) {
        return null;
    }

    return (
        <section className={stack} aria-label={t('clinicalData.beforeVisit')}>
            {alerts && alerts.totalCount > 0 && (
                <section className={warning} aria-label={t('clinicalData.criticalAlerts')}>
                    <h3 className={heading}>
                        <TriangleAlert size={16} aria-hidden />
                        {t('clinicalData.criticalAlerts')}
                    </h3>
                    <ul className={alertItems}>
                        {alerts.data.map((alert) => (
                            <li key={alert.id} className={multiline}>
                                <div className={heading}>{alert.title}</div>
                                {alert.description && <p>{alert.description}</p>}
                            </li>
                        ))}
                    </ul>
                    <ClinicalPagination page={page} totalCount={alerts.totalCount} onPage={onPage} />
                </section>
            )}
            {showEmpty && clinical.canViewAlerts && alerts?.totalCount === 0 && (
                <p className={muted}>{t('clinicalData.noCriticalAlerts')}</p>
            )}
            {profile && fields.length > 0 && (
                <div className={summary}>
                    <h3 className={heading}>{t('clinicalData.profile')}</h3>
                    <dl className={summary}>
                        {fields.map((field) => (
                            <div key={field}>
                                <dt className={heading}>{t(`clinicalData.fields.${field}`)}</dt>
                                <dd className={multiline}>{profile[field]}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
            {clinical.isLoading && (
                <p role="status" className={muted}>
                    {t('states.loading')}
                </p>
            )}
            {clinical.isError && (
                <p role="status" className={muted}>
                    {t('clinicalData.loadError')}
                </p>
            )}
        </section>
    );
}

export function PatientClinicalPreview({patientId, canRead}: {patientId: string; canRead: boolean}) {
    const [page, setPage] = useState(1);
    const clinical = usePatientClinicalPreview(patientId, canRead, page);

    return <PatientClinicalPreviewContent clinical={clinical} page={page} onPage={setPage} />;
}
