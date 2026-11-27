import type {ReactNode} from 'react';
import type {OperationalModuleType} from '@agenda-app/client';
import {Building2} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useAccount} from '@/hooks/useAccount';
import {EmptyState} from '@/views/components/EmptyState';
import {LoadingSkeleton} from '@/views/components/LoadingSkeleton';

interface ClinicModuleGateProps {
    module: OperationalModuleType;
    children: ReactNode;
}

/**
 * Renders a clinic-only screen (team, reception) only when the account has the module,
 * so a direct link from a solo account lands on an explanation instead of 403 errors.
 */
export function ClinicModuleGate({module, children}: ClinicModuleGateProps) {
    const {t} = useTranslation();
    const {isLoading, hasClinicModule} = useAccount();

    if (isLoading) return <LoadingSkeleton rows={3} />;

    if (hasClinicModule(module)) return <>{children}</>;

    return (
        <EmptyState
            icon={Building2}
            title={t(`account.moduleOff.${module}.title`)}
            message={t(`account.moduleOff.${module}.message`)}
        />
    );
}
