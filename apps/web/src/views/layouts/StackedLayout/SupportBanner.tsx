import {useEffect} from 'react';
import {useGetClinic, useGetCurrentClinicMember, useLeaveClinic} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate, useRouterState} from '@tanstack/react-router';
import {LifeBuoy} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/componentes/button';
import {useCan} from '@/hooks/useCan';
import {icon, supportBanner, supportBannerText} from './styles';

const ADMIN_PATH = '/admin';

/**
 * Global support users (the plexter "support" user) enter clinics they are not employees of.
 * Inside one, a banner makes clear it is a read-only support session and lets them leave it.
 * Outside any clinic, they are sent to the clinic list to pick one.
 */
export function SupportBanner() {
    const {t} = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const currentPath = useRouterState({select: (state) => state.location.pathname});
    const canEnterClinics = useCan({has: 'support-access:enter'});
    const memberQuery = useGetCurrentClinicMember({query: {retry: false}});
    const member = memberQuery.data;
    const isSupportAccess = member?.supportAccess === true;
    const clinicQuery = useGetClinic(member?.clinicId ?? '', {query: {enabled: isSupportAccess}});
    const leaveClinic = useLeaveClinic();
    const outsideAnyClinic = memberQuery.isError;

    useEffect(() => {
        if (outsideAnyClinic && canEnterClinics && !currentPath.startsWith(ADMIN_PATH)) {
            void navigate({to: '/admin/clinics', replace: true});
        }
    }, [outsideAnyClinic, canEnterClinics, currentPath, navigate]);

    if (!isSupportAccess) return null;

    function handleLeave() {
        leaveClinic.mutate(undefined, {
            onSuccess: () => {
                queryClient.clear();
                void navigate({to: '/admin/clinics'});
            },
        });
    }

    return (
        <div className={supportBanner} role="status">
            <span className={supportBannerText}>
                <LifeBuoy aria-hidden className={icon} />
                {t('support.banner', {clinic: clinicQuery.data?.name ?? ''})}
            </span>
            <Button variant="outline" size="sm" onClick={handleLeave} disabled={leaveClinic.isPending}>
                {t('support.leave')}
            </Button>
        </div>
    );
}
