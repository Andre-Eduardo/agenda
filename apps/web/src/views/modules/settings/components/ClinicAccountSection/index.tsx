import {useState} from 'react';
import {
    getGetClinicQueryKey,
    getGetCurrentClinicMemberPermissionsQueryKey,
    getGetMyModulesQueryKey,
    useGetClinic,
    useChangeAccountType,
    useGetCurrentClinicMember,
    useUpdateClinic,
    type UpdateClinicDto,
} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {SegmentedControl, SegmentedControlItem} from '@/components/ui/componentes/segmented-control';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {useCan} from '@/hooks/useCan';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {
    FormCard,
    FormSection,
    PageHeading,
    SkeletonTabContent,
    sectionSub,
    sectionTitle,
    skeletonH10,
    skeletonH4W48,
} from '@/views/modules/settings/pages/index/styles';

/** Clinic modules the account can turn on by itself (today: reception and call panel). */
export function ClinicAccountSection() {
    const {t} = useTranslation();
    const queryClient = useQueryClient();
    const memberQuery = useGetCurrentClinicMember();
    const clinicId = memberQuery.data?.clinicId;
    const clinicQuery = useGetClinic(clinicId ?? '', {query: {enabled: !!clinicId}});
    const updateClinic = useUpdateClinic();
    const canUpdateClinic = useCan({has: 'clinic:update'});
    const receptionEnabled = clinicQuery.data?.receptionEnabled ?? false;
    const accountType = clinicQuery.data?.accountType;
    const isOwner = memberQuery.data?.roles.includes('OWNER') === true && !memberQuery.data.supportAccess;
    const changeAccountType = useChangeAccountType();
    const [confirming, setConfirming] = useState(false);

    function refreshAccount() {
        void clinicQuery.refetch();

        if (clinicId) void queryClient.invalidateQueries({queryKey: getGetClinicQueryKey(clinicId)});

        void queryClient.invalidateQueries({queryKey: getGetMyModulesQueryKey()});
        void queryClient.invalidateQueries({queryKey: getGetCurrentClinicMemberPermissionsQueryKey()});
    }

    function handleChangeAccountType() {
        const next = accountType === 'SOLO' ? 'CLINIC' : 'SOLO';

        changeAccountType.mutate(
            {data: {accountType: next, confirmTeamAccess: next === 'CLINIC'}},
            {
                onSuccess: () => {
                    setConfirming(false);
                    toast.success(t(`account.type.changed.${next}`));
                    refreshAccount();
                },
                onError: () => {
                    setConfirming(false);
                    toast.error(t(`account.type.error.${next}`));
                },
            }
        );
    }

    function handleToggleReception(enabled: boolean) {
        if (!clinicId) return;

        updateClinic.mutate(
            // Orval marks every field of UpdateClinicDto as required even though the API accepts a partial update.
            {clinicId, data: {receptionEnabled: enabled} as UpdateClinicDto},
            {
                onSuccess: () => {
                    toast.success(enabled ? t('account.reception.enabled') : t('account.reception.disabled'));
                    void clinicQuery.refetch();
                    // Modules and the permissions they filter change together.
                    void queryClient.invalidateQueries({queryKey: getGetMyModulesQueryKey()});
                    void queryClient.invalidateQueries({queryKey: getGetCurrentClinicMemberPermissionsQueryKey()});
                },
                onError: () => toast.error(t('account.reception.error')),
            }
        );
    }

    return (
        <div>
            <PageHeading>
                <h1 className="title">Geral</h1>
                <p className="sub">Recursos ligados na sua conta.</p>
            </PageHeading>
            <FormCard>
                {memberQuery.isLoading || clinicQuery.isLoading ? (
                    <SkeletonTabContent>
                        <Skeleton className={skeletonH4W48} />
                        <Skeleton className={skeletonH10} />
                    </SkeletonTabContent>
                ) : (
                    <FormSection>
                        <div className="sec-head">
                            <span className="sec-num">1</span>
                            <div>
                                <div className={sectionTitle}>{t('account.reception.title')}</div>
                                <div className={sectionSub}>{t('account.reception.description')}</div>
                            </div>
                        </div>
                        {canUpdateClinic ? (
                            <SegmentedControl
                                value={receptionEnabled ? 'on' : 'off'}
                                onValueChange={(value) => {
                                    if (!updateClinic.isPending) handleToggleReception(value === 'on');
                                }}
                            >
                                <SegmentedControlItem value="on">Ativado</SegmentedControlItem>
                                <SegmentedControlItem value="off">Desativado</SegmentedControlItem>
                            </SegmentedControl>
                        ) : (
                            <p className={sectionSub}>{receptionEnabled ? 'Ativado' : 'Desativado'}</p>
                        )}
                    </FormSection>
                )}
            </FormCard>

            {isOwner && accountType && (
                <FormCard>
                    <FormSection>
                        <div className="sec-head">
                            <span className="sec-num">2</span>
                            <div>
                                <div className={sectionTitle}>{t(`account.type.title.${accountType}`)}</div>
                                <div className={sectionSub}>{t(`account.type.description.${accountType}`)}</div>
                            </div>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
                            {t(`account.type.action.${accountType}`)}
                        </Button>
                    </FormSection>
                </FormCard>
            )}

            {accountType && (
                <ConfirmDialog
                    opened={confirming}
                    title={t(`account.type.action.${accountType}`)}
                    message={t(`account.type.confirm.${accountType}`)}
                    confirmLabel={t(`account.type.action.${accountType}`)}
                    onConfirm={handleChangeAccountType}
                    onCancel={() => setConfirming(false)}
                    isLoading={changeAccountType.isPending}
                />
            )}
        </div>
    );
}
