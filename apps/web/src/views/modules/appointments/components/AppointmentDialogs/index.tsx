import {useEffect, useId, useState} from 'react';
import type {
    Appointment,
    AppointmentType,
    ClinicMember,
    CreateAppointmentDtoType,
    Patient,
    UpdateAppointmentInputDtoType,
} from '@agenda-app/client';
import {
    getListAppointmentFollowUpsQueryKey,
    useCallAppointment,
    useCancelAppointment,
    useCheckinAppointment,
    useCompleteAppointment,
    useConfirmAppointment,
    useCreateAppointment,
    useGetClinic,
    useGetCurrentClinicMember,
    RegisterPaymentDtoPaymentMethod,
    RegisterPaymentDtoStatus,
    useListEnrollments,
    useListInsurancePlans,
    useGetPatient,
    useGetProfessional,
    useGetRecord,
    useListManageableProfessionals,
    useListPackages,
    useListRooms,
    useListSubscriptions,
    useMarkNoShowAppointment,
    useRegisterPayment,
    useSearchPatients,
    useUpdateAppointment,
    useUpdatePaymentStatus,
} from '@agenda-app/client';
import {useQueryClient, type UseQueryResult} from '@tanstack/react-query';
import {Link, useNavigate} from '@tanstack/react-router';
import {X, ArrowUpRight, Pencil, Trash2, CircleCheck, CheckCheck, DoorOpen, PhoneCall, UserX} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {Sheet, SheetContent, SheetHeader, SheetTitle} from '@/components/ui/componentes/sheet';
import {Textarea} from '@/components/ui/componentes/textarea';
import {useCan, useCanState} from '@/hooks/useCan';
import {formatBRL} from '@/lib/utils';
import {css, cx} from '@/styled-system/css';
import {invalidateAppointmentRevenue, REVENUE_AMOUNT_FIELDS} from '@/utils/appointment-revenue';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {
    PatientClinicalPreviewContent,
    usePatientClinicalPreview,
} from '@/views/modules/patients/components/ClinicalData/PatientClinicalPreview';
import {
    MONTH_NAMES,
    WEEKDAYS_LONG,
    STATUS_LABELS,
    TYPE_LABELS,
    DURATIONS,
    getAvailabilityWarning,
    getApiErrorDetail,
    type ApptView,
    type PaginatedPage,
    type NewAppointmentPrefill,
    addDays,
    fmtDate,
    localDateTimeToISO,
    asStr,
    getInitials,
} from '../../shared/appointment-helpers';
import * as styles from '../../styles';
import {
    gap1_5,
    icon3,
    icon35,
    mt2,
    mt6,
    relative,
    sheetDotBase,
    sheetStatusBadge,
    srOnly,
    statusDot,
    truncate,
} from '../../styles';
import {
    isLedgerMethod,
    newReceiptPart,
    PaymentLedgerPanel,
    ReceiptPartsEditor,
    toReceiptParts,
    useReceivingAccounts,
    type ReceiptPartDraft,
} from '../PaymentLedger';
import {ProcedureColorDot} from '../ProcedureFields';
import {useAppointmentProcedure} from '../ProcedureFields/useAppointmentProcedure';

// ─────────────────────────────────────────────────────────────────
//   Appointment Detail Sheet
// ─────────────────────────────────────────────────────────────────
interface DetailSheetProps {
    apt: ApptView;
    patients: Patient[];
    onClose: () => void;
    onEdit: () => void;
    onCancel: () => void;
    onOpenPatient: (id: string) => void;
    onStatusChanged: () => void;
}

export function AppointmentDetailSheet({
    apt,
    patients,
    onClose,
    onEdit,
    onCancel,
    onOpenPatient,
    onStatusChanged,
}: DetailSheetProps) {
    const {t} = useTranslation();
    const {procedure} = apt.raw;
    const canViewPayment = useCan({has: 'appointment-payment:view'});
    const patient = patients.find((p) => p.id === apt.patientId);
    const durMin = apt.raw.durationMinutes;
    const durLabel =
        durMin >= 60 ? `${Math.floor(durMin / 60)}h${durMin % 60 ? ` ${durMin % 60}min` : ''}` : `${durMin} min`;
    const [y, mo, da] = apt.date.split('-').map(Number);
    const date = new Date(y, mo - 1, da);
    const isDone = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(apt.status);
    const mayViewClinical = useCan({hasAny: ['clinical-profile:view', 'patient-alert:view']});
    const mayCreateRecord = useCan({has: 'record:create'});
    const canCompleteAppointment = useCan({has: 'appointment:update'});
    const canStartRecord = mayCreateRecord && (apt.status === 'IN_PROGRESS' || apt.status === 'COMPLETED');
    const patientAccess = useGetPatient(apt.patientId, {
        query: {enabled: (!isDone && mayViewClinical) || canStartRecord},
    });
    const [clinicalPage, setClinicalPage] = useState(1);
    const clinical = usePatientClinicalPreview(
        apt.patientId,
        !isDone && !patientAccess.isError && patientAccess.data?.canReadClinicalData === true,
        clinicalPage
    );

    const confirm = useConfirmAppointment();
    const checkin = useCheckinAppointment();
    const call = useCallAppointment();
    const complete = useCompleteAppointment();
    const noShow = useMarkNoShowAppointment();

    function runTransition(mutation: {mutate: (vars: {id: string}, opts: object) => void}, successMessage: string) {
        mutation.mutate(
            {id: apt.id},
            {
                onSuccess: () => {
                    toast.success(successMessage);
                    onStatusChanged();
                },
                onError: () => toast.error('Não foi possível atualizar o status da consulta.'),
            }
        );
    }

    const transitionPending =
        confirm.isPending || checkin.isPending || call.isPending || complete.isPending || noShow.isPending;

    return (
        <Sheet open onOpenChange={(o) => !o && onClose()}>
            <SheetContent className={styles.detailSheetPanel}>
                <SheetHeader>
                    <SheetTitle className={srOnly}>Detalhes do agendamento</SheetTitle>
                    <div className={styles.sheetInfoRow}>
                        <span className={styles.sheetEyebrow}>Agendamento</span>
                        <span className={sheetStatusBadge({status: apt.status})}>
                            <span className={cx(sheetDotBase, statusDot({status: apt.status}))} />
                            {STATUS_LABELS[apt.status]}
                        </span>
                    </div>
                </SheetHeader>

                <div className={mt6}>
                    {/* Patient card */}
                    <div className={styles.sheetPatientCard}>
                        <div className={styles.patAvatarLg}>{patient ? getInitials(patient.name) : '?'}</div>
                        <div className={styles.sheetPatientBody}>
                            <div className={styles.sheetPatientName}>{patient?.name ?? '—'}</div>
                            {asStr(patient?.email) && (
                                <div className={styles.sheetPatientMeta}>{asStr(patient?.email)}</div>
                            )}
                        </div>
                        <button
                            type="button"
                            className={styles.patProfileLink}
                            onClick={() => onOpenPatient(apt.patientId)}
                        >
                            Ver perfil <ArrowUpRight className={icon3} />
                        </button>
                    </div>

                    {!isDone && (
                        <PatientClinicalPreviewContent
                            clinical={clinical}
                            page={clinicalPage}
                            onPage={setClinicalPage}
                        />
                    )}

                    {/* Schedule */}
                    <div className={styles.sheetSection}>
                        <div className={styles.sheetSectionTitle}>Horário</div>
                        <div className={styles.sheetKvGrid}>
                            <div className={styles.sheetKv}>
                                <span className={styles.sheetKvKey}>Data</span>
                                <span className={styles.sheetKvText}>
                                    {WEEKDAYS_LONG[date.getDay()]}, {da} de {MONTH_NAMES[mo - 1]} de {y}
                                </span>
                            </div>
                            <div className={styles.sheetKv}>
                                <span className={styles.sheetKvKey}>Horário</span>
                                <span className={styles.sheetKvVal}>
                                    {apt.start} – {apt.end}
                                </span>
                            </div>
                            <div className={styles.sheetKv}>
                                <span className={styles.sheetKvKey}>Duração</span>
                                <span className={styles.sheetKvVal}>{durLabel}</span>
                            </div>
                            <div className={styles.sheetKv}>
                                <span className={styles.sheetKvKey}>Tipo</span>
                                <span className={styles.sheetKvText}>{TYPE_LABELS[apt.type]}</span>
                            </div>
                        </div>
                    </div>

                    {procedure && (
                        <div className={styles.sheetSection} role="group" aria-label={t('procedure.selection')}>
                            <div className={styles.sheetSectionTitle}>{t('procedure.selection')}</div>
                            <div className={styles.sheetKvGrid}>
                                <div className={styles.sheetKv}>
                                    <span className={styles.sheetKvKey}>{t('procedure.name')}</span>
                                    <span className={styles.sheetKvText}>
                                        <ProcedureColorDot color={procedure.color} /> {procedure.name}
                                    </span>
                                </div>
                                <div className={styles.sheetKv}>
                                    <span className={styles.sheetKvKey}>{t('procedure.modality')}</span>
                                    <span className={styles.sheetKvText}>
                                        {t(`procedure.modalities.${procedure.modality}`)}
                                    </span>
                                </div>
                                <div className={styles.sheetKv}>
                                    <span className={styles.sheetKvKey}>{t('procedure.price')}</span>
                                    <span className={styles.sheetKvVal}>{formatBRL(procedure.priceInCents / 100)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className={styles.sheetSection}>
                        <div className={styles.sheetSectionTitle}>Observações</div>
                        {apt.note ? (
                            <p className={styles.sheetNotes}>{apt.note}</p>
                        ) : (
                            <p className={styles.sheetNotesEmpty}>Sem observações registradas.</p>
                        )}
                    </div>

                    {canStartRecord && !patientAccess.isError && patientAccess.data?.canWriteClinicalData && (
                        <div className={styles.sheetSection}>
                            <Button asChild size="sm">
                                <Link
                                    to="/patients/$patientId/records/new"
                                    params={{patientId: apt.patientId}}
                                    search={{appointmentId: apt.id}}
                                >
                                    {t('recordLifecycle.createFromAppointment')}
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* Payment */}
                    {canViewPayment && <AppointmentPaymentSection appointment={apt.raw} onChanged={onStatusChanged} />}

                    {/* Actions */}
                    {!isDone && (
                        <div className={styles.sheetActions}>
                            {apt.status === 'SCHEDULED' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={gap1_5}
                                    disabled={transitionPending}
                                    onClick={() => runTransition(confirm, 'Consulta confirmada')}
                                >
                                    <CircleCheck className={icon35} /> Confirmar
                                </Button>
                            )}
                            {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={gap1_5}
                                    disabled={transitionPending}
                                    onClick={() => runTransition(checkin, 'Chegada registrada')}
                                >
                                    <DoorOpen className={icon35} /> Check-in
                                </Button>
                            )}
                            {apt.status === 'ARRIVED' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={gap1_5}
                                    disabled={
                                        transitionPending ||
                                        (mayViewClinical && patientAccess.isLoading) ||
                                        clinical.isLoading
                                    }
                                    onClick={() => runTransition(call, 'Paciente chamado')}
                                >
                                    <PhoneCall className={icon35} /> Chamar
                                </Button>
                            )}
                            {apt.status === 'IN_PROGRESS' && canCompleteAppointment && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={gap1_5}
                                    disabled={transitionPending}
                                    onClick={() => runTransition(complete, t('reception.success.complete'))}
                                >
                                    <CheckCheck className={icon35} /> {t('reception.complete')}
                                </Button>
                            )}
                            {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={gap1_5}
                                    disabled={transitionPending}
                                    onClick={() => runTransition(noShow, 'Falta registrada')}
                                >
                                    <UserX className={icon35} /> Não compareceu
                                </Button>
                            )}
                            {apt.status !== 'IN_PROGRESS' && (
                                <Button size="sm" variant="outline" className={gap1_5} onClick={onEdit}>
                                    <Pencil className={icon35} /> Editar
                                </Button>
                            )}
                            {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'ARRIVED') && (
                                <Button size="sm" variant="outline" className={styles.cancelBtn} onClick={onCancel}>
                                    <Trash2 className={icon35} /> Cancelar consulta
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ── Payment (register / view / update) ───────────────────────────────

const PAYMENT_STATUS_BADGE_VARIANT: Record<string, 'warning' | 'success' | 'secondary' | 'destructive'> = {
    PENDING: 'warning',
    PAID: 'success',
    EXEMPT: 'secondary',
    REFUNDED: 'destructive',
};

function PaymentCoverageSelect({
    label,
    value,
    onChange,
    options,
    loading,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{id: string; name: string}>;
    loading: boolean;
}) {
    const id = useId();
    const {t} = useTranslation();

    return (
        <div className={styles.sheetKv}>
            <Label htmlFor={id}>{label}</Label>
            <Select value={value} onValueChange={onChange} disabled={loading || options.length === 0}>
                <SelectTrigger id={id}>
                    <SelectValue placeholder={t('appointmentRevenue.selectCoverage')} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {loading && <p role="status">{t('states.loading')}</p>}
            {!loading && options.length === 0 && (
                <p className={styles.sheetNotesEmpty}>{t('appointmentRevenue.noCoverage')}</p>
            )}
        </div>
    );
}

function AppointmentPaymentSection({appointment, onChanged}: {appointment: Appointment; onChanged: () => void}) {
    const {t} = useTranslation();
    const registerPayment = useRegisterPayment();
    const updatePaymentStatus = useUpdatePaymentStatus();
    const canRegister = useCan({has: 'appointment-payment:register'});
    const canUpdate = useCan({has: 'appointment-payment:update'});

    const [showForm, setShowForm] = useState(false);
    const [method, setMethod] = useState<RegisterPaymentDtoPaymentMethod>('PIX');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<RegisterPaymentDtoStatus>('PAID');
    const [insurancePlanId, setInsurancePlanId] = useState('');
    const [insuranceAuthCode, setInsuranceAuthCode] = useState('');
    const [patientPackageId, setPatientPackageId] = useState('');
    const [patientSubscriptionId, setPatientSubscriptionId] = useState('');
    const [notes, setNotes] = useState('');
    const [splitParts, setSplitParts] = useState<ReceiptPartDraft[] | null>(null);

    const {revenue, patientId, clinicId, id} = appointment;
    const hasPayment = revenue?.paymentMethod != null;
    const isTracked =
        revenue?.paymentMethod != null && (revenue.paymentMethod === 'MIXED' || isLedgerMethod(revenue.paymentMethod));
    const mayRegister = canRegister && !hasPayment && appointment.status !== 'CANCELLED';
    const isCompleted = appointment.status === 'COMPLETED';
    const isInsurance = method === 'INSURANCE';
    const registeredStatusByMethod: Partial<Record<RegisterPaymentDtoPaymentMethod, RegisterPaymentDtoStatus>> = {
        INSURANCE: 'PENDING',
        COURTESY: 'EXEMPT',
        PACKAGE: 'PAID',
        SUBSCRIPTION: 'PAID',
    };
    const isCovered = method === 'PACKAGE' || method === 'SUBSCRIPTION' || method === 'COURTESY';
    const packages = useListPackages(patientId, {query: {enabled: showForm && method === 'PACKAGE'}});
    const subscriptions = useListSubscriptions(patientId, {query: {enabled: showForm && method === 'SUBSCRIPTION'}});
    const enrollments = useListEnrollments(patientId, {query: {enabled: showForm && isInsurance}});
    const plans = useListInsurancePlans(clinicId, {query: {enabled: showForm && isInsurance}});
    const activePackages = (packages.data ?? []).filter((pkg) => pkg.status === 'ACTIVE' && pkg.remainingCredits > 0);
    const activeSubscriptions = (subscriptions.data ?? []).filter((subscription) => subscription.status === 'ACTIVE');
    const activePlans = (plans.data ?? []).filter((plan) =>
        enrollments.data?.some((enrollment) => enrollment.status === 'ACTIVE' && enrollment.insurancePlanId === plan.id)
    );
    const canSplit = isLedgerMethod(method) && status === 'PAID';
    const isSplit = canSplit && splitParts !== null;
    const accounts = useReceivingAccounts(isSplit);

    function toggleSplit() {
        if (splitParts !== null) {
            setSplitParts(null);

            return;
        }

        const first = isLedgerMethod(method) ? method : 'PIX';

        setSplitParts([newReceiptPart(first, amount), newReceiptPart(first === 'CASH' ? 'PIX' : 'CASH', '')]);
    }

    function handleRegister() {
        const amountBrl = isCovered || amount.trim() === '' ? undefined : Number(amount.replace(',', '.'));
        const invalidAmount =
            !isCovered &&
            ((amountBrl === undefined && !appointment.procedure) ||
                (amountBrl !== undefined && !/^\d+(?:[.,]\d{1,2})?$/.test(amount.trim())));
        const missingCoverage =
            (isInsurance && !insurancePlanId) ||
            (method === 'PACKAGE' && !patientPackageId) ||
            (method === 'SUBSCRIPTION' && !patientSubscriptionId);

        const parts = isSplit ? toReceiptParts(splitParts) : undefined;

        if (invalidAmount || missingCoverage || parts === null) {
            toast.error(
                t(
                    missingCoverage && !invalidAmount
                        ? 'appointmentRevenue.selectCoverage'
                        : 'appointmentRevenue.invalidAmount'
                )
            );

            return;
        }

        registerPayment.mutate(
            {
                id,
                data: {
                    paymentMethod: method,
                    amountBrl,
                    status: registeredStatusByMethod[method] ?? status,
                    insurancePlanId: isInsurance ? insurancePlanId : undefined,
                    insuranceAuthCode: isInsurance ? insuranceAuthCode.trim() || undefined : undefined,
                    patientPackageId: method === 'PACKAGE' ? patientPackageId : undefined,
                    patientSubscriptionId: method === 'SUBSCRIPTION' ? patientSubscriptionId : undefined,
                    notes: notes.trim() || undefined,
                    parts,
                },
            },
            {
                onSuccess: () => {
                    toast.success(t('appointmentRevenue.registered'));
                    setShowForm(false);
                    setSplitParts(null);
                    onChanged();
                },
                onError: (error) => toast.error(getApiErrorDetail(error) ?? t('appointmentRevenue.saveError')),
            }
        );
    }

    function markAsPaid() {
        updatePaymentStatus.mutate(
            {id, data: {status: 'PAID'}},
            {
                onSuccess: () => {
                    toast.success(t('appointmentRevenue.updated'));
                    onChanged();
                },
                onError: (error) => toast.error(getApiErrorDetail(error) ?? t('appointmentRevenue.saveError')),
            }
        );
    }

    return (
        <div className={styles.sheetSection} role="group" aria-label={t('appointmentRevenue.title')}>
            <div className={styles.sheetSectionTitle}>{t('appointmentRevenue.title')}</div>
            {revenue && (
                <div className={styles.sheetKvGrid}>
                    {REVENUE_AMOUNT_FIELDS.map((field) => (
                        <div key={field} className={styles.sheetKv}>
                            <span className={styles.sheetKvKey}>{t(`appointmentRevenue.${field}`)}</span>
                            <span className={styles.sheetKvVal}>{formatBRL(revenue[field])}</span>
                        </div>
                    ))}
                    <div className={styles.sheetKv}>
                        <span className={styles.sheetKvKey}>{t('appointmentRevenue.method')}</span>
                        <span className={styles.sheetKvText}>
                            {revenue.paymentMethod
                                ? t(`appointmentRevenue.methods.${revenue.paymentMethod}`)
                                : t('appointmentRevenue.noMethod')}
                        </span>
                    </div>
                    <div className={styles.sheetKv}>
                        <span className={styles.sheetKvKey}>Status</span>
                        <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[revenue.status]}>
                            {t(`appointmentRevenue.statuses.${revenue.status}`)}
                        </Badge>
                    </div>
                    {revenue.paidAt && (
                        <div className={styles.sheetKv}>
                            <span className={styles.sheetKvKey}>{t('appointmentRevenue.paidAt')}</span>
                            <span className={styles.sheetKvText}>{new Date(revenue.paidAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            )}

            {isTracked && <PaymentLedgerPanel appointmentId={id} onChanged={onChanged} />}

            {canUpdate &&
                !isTracked &&
                revenue?.status === 'PENDING' &&
                hasPayment &&
                revenue.insuranceClaimStatus === null && (
                    <Button
                        size="sm"
                        variant="outline"
                        className={mt2}
                        disabled={updatePaymentStatus.isPending}
                        onClick={markAsPaid}
                    >
                        {t('appointmentRevenue.markPaid')}
                    </Button>
                )}

            {mayRegister && showForm && (
                <div className={styles.sheetKvGrid}>
                    <div className={styles.sheetKv}>
                        <Label htmlFor="appointment-payment-method">{t('appointmentRevenue.method')}</Label>
                        <Select
                            value={method}
                            onValueChange={(value: RegisterPaymentDtoPaymentMethod) => setMethod(value)}
                        >
                            <SelectTrigger id="appointment-payment-method">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(RegisterPaymentDtoPaymentMethod).map((code) => (
                                    <SelectItem
                                        key={code}
                                        value={code}
                                        disabled={!isCompleted && (code === 'PACKAGE' || code === 'SUBSCRIPTION')}
                                    >
                                        {t(`appointmentRevenue.methods.${code}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {!isCovered && (
                        <div className={styles.sheetKv}>
                            <Label htmlFor="appointment-payment-amount">{t('appointmentRevenue.amount')}</Label>
                            <Input
                                id="appointment-payment-amount"
                                inputMode="decimal"
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                            />
                        </div>
                    )}
                    {!isCovered && !isInsurance && (
                        <div className={styles.sheetKv}>
                            <Label htmlFor="appointment-payment-status">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value: RegisterPaymentDtoStatus) => setStatus(value)}
                            >
                                <SelectTrigger id="appointment-payment-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(RegisterPaymentDtoStatus).map((code) => (
                                        <SelectItem key={code} value={code}>
                                            {t(`appointmentRevenue.statuses.${code}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {canSplit && (
                        <div className={styles.sheetKv}>
                            <Button size="sm" variant="ghost" aria-pressed={isSplit} onClick={toggleSplit}>
                                {t('appointmentRevenue.ledger.split')}
                            </Button>
                        </div>
                    )}
                    {isSplit && (
                        <ReceiptPartsEditor
                            parts={splitParts}
                            onChange={setSplitParts}
                            accounts={accounts}
                            expectedBrl={amount.trim() === '' ? null : Number(amount.replace(',', '.'))}
                        />
                    )}
                    {isInsurance && (
                        <>
                            <PaymentCoverageSelect
                                label={t('appointmentRevenue.methods.INSURANCE')}
                                value={insurancePlanId}
                                onChange={setInsurancePlanId}
                                options={activePlans.map((plan) => ({id: plan.id, name: plan.name}))}
                                loading={plans.isPending || enrollments.isPending}
                            />
                            <div className={styles.sheetKv}>
                                <Label htmlFor="appointment-payment-auth">
                                    {t('appointmentRevenue.authorization')}
                                </Label>
                                <Input
                                    id="appointment-payment-auth"
                                    value={insuranceAuthCode}
                                    onChange={(event) => setInsuranceAuthCode(event.target.value)}
                                />
                            </div>
                        </>
                    )}
                    {method === 'PACKAGE' && (
                        <PaymentCoverageSelect
                            label={t('appointmentRevenue.methods.PACKAGE')}
                            value={patientPackageId}
                            onChange={setPatientPackageId}
                            loading={packages.isPending}
                            options={activePackages.map((pkg) => ({id: pkg.id, name: pkg.planNameSnapshot}))}
                        />
                    )}
                    {method === 'SUBSCRIPTION' && (
                        <PaymentCoverageSelect
                            label={t('appointmentRevenue.methods.SUBSCRIPTION')}
                            value={patientSubscriptionId}
                            onChange={setPatientSubscriptionId}
                            loading={subscriptions.isPending}
                            options={activeSubscriptions.map((subscription) => ({
                                id: subscription.id,
                                name: subscription.planNameSnapshot,
                            }))}
                        />
                    )}
                    <div className={styles.sheetKv}>
                        <Label htmlFor="appointment-payment-notes">{t('appointmentRevenue.notes')}</Label>
                        <Input
                            id="appointment-payment-notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                        />
                    </div>
                    <div className={gap1_5}>
                        <Button size="sm" disabled={registerPayment.isPending} onClick={handleRegister}>
                            {t('appointmentRevenue.register')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                            {t('actions.cancel')}
                        </Button>
                    </div>
                </div>
            )}

            {mayRegister && !showForm && (
                <Button
                    size="sm"
                    variant="outline"
                    className={mt2}
                    onClick={() => {
                        setAmount(appointment.procedure ? (appointment.procedure.priceInCents / 100).toFixed(2) : '');
                        setShowForm(true);
                    }}
                >
                    {t('appointmentRevenue.register')}
                </Button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Edit Dialog
// ─────────────────────────────────────────────────────────────────
interface EditDialogProps {
    apt: ApptView;
    onClose: () => void;
    onSaved: () => void;
}

export function EditAppointmentDialog({apt, onClose, onSaved}: EditDialogProps) {
    const [date, setDate] = useState(apt.date);
    const [startTime, setStartTime] = useState(apt.start);
    const [durMin, setDurMin] = useState(apt.raw.durationMinutes);
    const [type, setType] = useState<AppointmentType>(apt.type);
    const procedure = useAppointmentProcedure(
        apt.raw.procedure ? {...apt.raw.procedure, durationMinutes: apt.raw.durationMinutes} : undefined
    );
    const requiresProcedure = type === 'PROCEDURE' && apt.type !== 'PROCEDURE';
    const [note, setNote] = useState(apt.note ?? '');
    const [roomId, setRoomId] = useState(apt.roomId ?? '');
    const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);
    const update = useUpdateAppointment();

    const meQuery = useGetCurrentClinicMember();
    const clinicQuery = useGetClinic(meQuery.data?.clinicId ?? '', {query: {enabled: !!meQuery.data?.clinicId}});
    const roomManagementEnabled = clinicQuery.data?.roomManagementEnabled ?? false;
    const roomsQuery = useListRooms({query: {enabled: roomManagementEnabled}});

    const submit = (confirmOutsideAvailability: boolean) => {
        if (!date || !startTime || !procedure.valid || (requiresProcedure && !procedure.hasProcedure)) return;

        const startAt = localDateTimeToISO(date, startTime);

        update.mutate(
            {
                id: apt.id,
                data: {
                    startAt,
                    ...procedure.buildFields(startAt, durMin),
                    type: type as unknown as UpdateAppointmentInputDtoType,
                    note: note || null,
                    attendedByMemberId: apt.attendedByMemberId,
                    roomId: roomManagementEnabled && roomId ? roomId : null,
                    confirmOutsideAvailability,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Consulta atualizada');
                    onSaved();
                    onClose();
                },
                onError: (error) => {
                    const warning = getAvailabilityWarning(error);

                    if (warning && !confirmOutsideAvailability) {
                        setAvailabilityWarning(warning);

                        return;
                    }

                    toast.error(getApiErrorDetail(error) ?? 'Erro ao atualizar consulta');
                },
            }
        );
    };

    const handleSave = () => submit(false);

    return (
        <>
            <Dialog open onOpenChange={(o) => !o && onClose()}>
                <DialogContent className={styles.editDialogWidth}>
                    <DialogHeader>
                        <DialogTitle>Editar agendamento</DialogTitle>
                    </DialogHeader>
                    <div className={styles.formBody}>
                        <div className={styles.formRow}>
                            <div className={styles.formField}>
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    aria-label="Data"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className={styles.formField}>
                                <Label>Horário</Label>
                                <Input
                                    type="time"
                                    aria-label="Horário"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                        </div>
                        {procedure.renderFields(requiresProcedure)}
                        <div className={styles.formRow}>
                            {!procedure.hasProcedure && (
                                <div className={styles.formField}>
                                    <Label>Duração</Label>
                                    <Select value={String(durMin)} onValueChange={(v) => setDurMin(Number(v))}>
                                        <SelectTrigger aria-label="Duração">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...new Set([...DURATIONS, durMin])]
                                                .sort((a, b) => a - b)
                                                .map((d) => (
                                                    <SelectItem key={d} value={String(d)}>
                                                        {d >= 60
                                                            ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}min` : ''}`
                                                            : `${d} min`}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className={styles.formField}>
                                <Label>Tipo</Label>
                                <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {roomManagementEnabled && (
                            <div className={styles.formField}>
                                <Label>
                                    Sala <span className={styles.optionalLabel}>opcional</span>
                                </Label>
                                <Select value={roomId} onValueChange={setRoomId}>
                                    <SelectTrigger aria-label="Sala">
                                        <SelectValue placeholder="Sala padrão do profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(roomsQuery.data ?? []).map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className={styles.formField}>
                            <Label>
                                Observações <span className={styles.optionalLabel}>opcional</span>
                            </Label>
                            <Textarea
                                rows={3}
                                placeholder="Informações adicionais..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.formFooter}>
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={
                                update.isPending ||
                                !date ||
                                !startTime ||
                                !procedure.valid ||
                                (requiresProcedure && !procedure.hasProcedure)
                            }
                        >
                            {update.isPending ? 'Salvando…' : 'Salvar alterações'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                opened={!!availabilityWarning}
                title="Fora da disponibilidade do profissional"
                message={availabilityWarning ?? undefined}
                confirmLabel="Agendar mesmo assim"
                isLoading={update.isPending}
                onConfirm={() => {
                    setAvailabilityWarning(null);
                    submit(true);
                }}
                onCancel={() => setAvailabilityWarning(null)}
            />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────
//   New Appointment Dialog
// ─────────────────────────────────────────────────────────────────
const followUpPlan = css({whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 'sm', mt: '1'});

interface AppointmentFollowUpContext {
    recordId: string;
    patient: Patient;
    professional: ClinicMember;
    plan: string | null;
}

interface NewApptDialogProps {
    prefill: NewAppointmentPrefill | null;
    defaultMemberId: string;
    followUp?: AppointmentFollowUpContext;
    onClose: () => void;
    onSaved: () => void;
}

export function NewAppointmentDialog({prefill, defaultMemberId, followUp, onClose, onSaved}: NewApptDialogProps) {
    const {t} = useTranslation();
    const today = fmtDate(new Date());
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(followUp?.patient ?? null);
    const [date, setDate] = useState(prefill?.date ?? today);
    const [startTime, setStartTime] = useState(prefill?.start ?? '09:00');
    const [durMin, setDurMin] = useState(60);
    const [type, setType] = useState<CreateAppointmentDtoType>('RETURN');
    const procedure = useAppointmentProcedure();
    const requiresProcedure = type === 'PROCEDURE';
    const [note, setNote] = useState('');
    const [showDrop, setShowDrop] = useState(false);

    const patientsQ = useSearchPatients(
        {
            term: patientSearch,
            limit: 20,
            cursor: null,
            sort: null,
        },
        {query: {enabled: !followUp}}
    ) as unknown as UseQueryResult<PaginatedPage<Patient>>;
    const patientsList = patientsQ.data?.data ?? [];

    const [roomId, setRoomId] = useState(prefill?.roomId ?? '');
    const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);

    const create = useCreateAppointment();

    const meQuery = useGetCurrentClinicMember();
    const clinicQuery = useGetClinic(meQuery.data?.clinicId ?? '', {query: {enabled: !!meQuery.data?.clinicId}});
    const roomManagementEnabled = clinicQuery.data?.roomManagementEnabled ?? false;
    const roomsQuery = useListRooms({query: {enabled: roomManagementEnabled}});

    // Which professional the appointment is for. Only surfaced as a field when the
    // actor manages more than one agenda (owner/admin, or a grantee with multiple
    // grants) — a plain professional only ever manages their own, so it's implicit.
    const manageableData = useListManageableProfessionals({query: {enabled: !followUp}}).data;
    const manageableProfessionals = manageableData ?? [];
    const showProfessionalField = !followUp && manageableProfessionals.length > 1;

    const [attendedByMemberId, setAttendedByMemberId] = useState(
        followUp?.professional.id ?? prefill?.attendedByMemberId ?? defaultMemberId
    );

    useEffect(() => {
        if (followUp || !manageableData || manageableData.length === 0) return;

        setAttendedByMemberId((prev) =>
            manageableData.some((m) => m.id === prev) ? prev : (manageableData[0]?.id ?? prev)
        );
    }, [followUp, manageableData]);

    const submit = (confirmOutsideAvailability: boolean) => {
        if (!selectedPatient) {
            toast.error('Selecione um paciente');

            return;
        }

        if (!date || !startTime || !procedure.valid || (requiresProcedure && !procedure.hasProcedure)) return;

        const startAt = localDateTimeToISO(date, startTime);

        if (followUp && new Date(startAt).getTime() <= Date.now()) {
            toast.error(t('followUp.futureDate'));

            return;
        }

        create.mutate(
            {
                data: {
                    patientId: selectedPatient.id,
                    attendedByMemberId,
                    startAt,
                    ...procedure.buildFields(startAt, durMin),
                    type,
                    note: note || null,
                    retroactive: !followUp,
                    followUpFromRecordId: followUp?.recordId,
                    roomId: roomManagementEnabled && roomId ? roomId : undefined,
                    confirmOutsideAvailability,
                },
            },
            {
                onSuccess: () => {
                    toast.success(followUp ? t('followUp.saved') : 'Consulta agendada');
                    onSaved();
                },
                onError: (error) => {
                    const warning = getAvailabilityWarning(error);

                    if (warning && !confirmOutsideAvailability) {
                        setAvailabilityWarning(warning);

                        return;
                    }

                    toast.error(
                        getApiErrorDetail(error) ?? (followUp ? t('followUp.saveError') : 'Erro ao criar consulta')
                    );
                },
            }
        );
    };

    const handleSave = () => submit(false);
    const submitLabel = followUp ? t('followUp.schedule') : 'Agendar consulta';

    return (
        <>
            <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
                <DialogContent className={styles.newApptDialogWidth}>
                    <DialogHeader>
                        <DialogTitle>{followUp ? t('followUp.schedule') : 'Novo agendamento'}</DialogTitle>
                        {followUp && <DialogDescription>{t('followUp.linkedToRecord')}</DialogDescription>}
                    </DialogHeader>
                    <div className={styles.formBody}>
                        {/* Patient */}
                        <div className={cx(styles.formField, relative)}>
                            <Label>Paciente</Label>
                            {selectedPatient ? (
                                <div className={styles.patSearchPill}>
                                    <div className={styles.patAvatarSm}>{getInitials(selectedPatient.name)}</div>
                                    <span className={styles.patSearchName}>{selectedPatient.name}</span>
                                    {!followUp && (
                                        <button
                                            type="button"
                                            className={styles.patClearBtn}
                                            onClick={() => setSelectedPatient(null)}
                                        >
                                            <X className={icon35} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.patSearchWrap}>
                                    <Input
                                        placeholder="Buscar paciente..."
                                        value={patientSearch}
                                        onChange={(e) => {
                                            setPatientSearch(e.target.value);
                                            setShowDrop(true);
                                        }}
                                        onFocus={() => setShowDrop(true)}
                                        onBlur={() => setTimeout(() => setShowDrop(false), 200)}
                                    />
                                    {showDrop && patientsList.length > 0 && (
                                        <div className={styles.patSearchDrop}>
                                            {patientsList.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className={styles.patSearchRow}
                                                    onMouseDown={() => {
                                                        setSelectedPatient(p);
                                                        setPatientSearch('');
                                                        setShowDrop(false);
                                                    }}
                                                >
                                                    <div className={styles.patAvatarSm}>{getInitials(p.name)}</div>
                                                    <span className={truncate}>{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {followUp && (
                            <div className={styles.formField}>
                                <Label>{t('followUp.professional')}</Label>
                                <span>{followUp.professional.displayName ?? t('followUp.professional')}</span>
                                {followUp.plan && (
                                    <details>
                                        <summary>{t('followUp.sourcePlan')}</summary>
                                        <p className={followUpPlan}>{followUp.plan}</p>
                                    </details>
                                )}
                            </div>
                        )}

                        {showProfessionalField && (
                            <div className={styles.formField}>
                                <Label>Profissional</Label>
                                <Select value={attendedByMemberId} onValueChange={setAttendedByMemberId}>
                                    <SelectTrigger aria-label="Profissional">
                                        <SelectValue placeholder="Selecione o profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {manageableProfessionals.map((member) => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.displayName ?? 'Profissional'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className={styles.formRow}>
                            <div className={styles.formField}>
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    aria-label="Data"
                                    min={followUp ? today : undefined}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className={styles.formField}>
                                <Label>Horário</Label>
                                <Input
                                    type="time"
                                    aria-label="Horário"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                        </div>

                        {procedure.renderFields(requiresProcedure)}
                        <div className={styles.formRow}>
                            {!procedure.hasProcedure && (
                                <div className={styles.formField}>
                                    <Label>Duração</Label>
                                    <Select value={String(durMin)} onValueChange={(v) => setDurMin(Number(v))}>
                                        <SelectTrigger aria-label="Duração">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...new Set([...DURATIONS, durMin])]
                                                .sort((a, b) => a - b)
                                                .map((d) => (
                                                    <SelectItem key={d} value={String(d)}>
                                                        {d >= 60
                                                            ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}min` : ''}`
                                                            : `${d} min`}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className={styles.formField}>
                                <Label>Tipo</Label>
                                <Select
                                    value={type}
                                    disabled={!!followUp}
                                    onValueChange={(v) => setType(v as CreateAppointmentDtoType)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {roomManagementEnabled && (
                            <div className={styles.formField}>
                                <Label>
                                    Sala <span className={styles.optionalLabel}>opcional</span>
                                </Label>
                                <Select value={roomId} onValueChange={setRoomId}>
                                    <SelectTrigger aria-label="Sala">
                                        <SelectValue placeholder="Sala padrão do profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(roomsQuery.data ?? []).map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className={styles.formField}>
                            <Label>
                                Observações <span className={styles.optionalLabel}>opcional</span>
                            </Label>
                            <Textarea
                                rows={2}
                                placeholder="Informações adicionais..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.formFooter}>
                        <Button variant="outline" onClick={onClose} disabled={create.isPending}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={
                                create.isPending ||
                                !selectedPatient ||
                                !attendedByMemberId ||
                                !date ||
                                !startTime ||
                                !procedure.valid ||
                                (requiresProcedure && !procedure.hasProcedure)
                            }
                        >
                            {create.isPending ? t('states.saving') : submitLabel}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                opened={!!availabilityWarning}
                title="Fora da disponibilidade do profissional"
                message={availabilityWarning ?? undefined}
                confirmLabel="Agendar mesmo assim"
                isLoading={create.isPending}
                onConfirm={() => {
                    setAvailabilityWarning(null);
                    submit(true);
                }}
                onCancel={() => setAvailabilityWarning(null)}
            />
        </>
    );
}

export function RecordFollowUpDialog({recordId, onDismiss}: {recordId: string; onDismiss: () => void}) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const access = useCanState({hasAll: ['appointment:create', 'record:view', 'professional:view']});
    const recordQuery = useGetRecord(recordId, {query: {enabled: access.allowed}});
    const record = recordQuery.data;
    const patientQuery = useGetPatient(record?.patientId ?? '', {query: {enabled: !!record && access.allowed}});
    const professionalQuery = useGetProfessional(record?.responsibleProfessionalId ?? '', {
        query: {enabled: !!record && access.allowed},
    });
    const agendasQuery = useListManageableProfessionals({query: {enabled: access.allowed}});
    const professional = agendasQuery.data?.find((member) => member.id === professionalQuery.data?.clinicMemberId);
    const loading =
        access.isLoading ||
        recordQuery.isLoading ||
        patientQuery.isLoading ||
        professionalQuery.isLoading ||
        agendasQuery.isLoading;
    const error =
        access.isError ||
        recordQuery.isError ||
        patientQuery.isError ||
        professionalQuery.isError ||
        agendasQuery.isError;

    const returnToRecord = () => {
        if (record && access.allowed && !recordQuery.isError) {
            void navigate({
                to: '/patients/$patientId/records/$recordId',
                params: {patientId: record.patientId, recordId},
                replace: true,
            });
        } else {
            onDismiss();
        }
    };

    if (!access.allowed || error || !record || !patientQuery.data || !professional) {
        return (
            <Dialog open onOpenChange={(open) => !open && returnToRecord()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('followUp.schedule')}</DialogTitle>
                        <DialogDescription role="status">
                            {loading ? t('states.loading') : t('followUp.unavailable')}
                        </DialogDescription>
                    </DialogHeader>
                    <Button variant="outline" onClick={returnToRecord}>
                        {t('actions.close')}
                    </Button>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <NewAppointmentDialog
            prefill={{date: fmtDate(addDays(new Date(), 1)), start: '09:00'}}
            defaultMemberId={professional.id}
            followUp={{recordId, patient: patientQuery.data, professional, plan: asStr(record.plan)}}
            onClose={returnToRecord}
            onSaved={() => {
                invalidateAppointmentRevenue(queryClient, record.clinicId);
                void queryClient.invalidateQueries({queryKey: getListAppointmentFollowUpsQueryKey(recordId)});
                returnToRecord();
            }}
        />
    );
}

// ─────────────────────────────────────────────────────────────────
//   Cancel Confirm Dialog
// ─────────────────────────────────────────────────────────────────
interface CancelDialogProps {
    apt: ApptView;
    onClose: () => void;
    onCancelled: () => void;
}

export function CancelDialog({apt, onClose, onCancelled}: CancelDialogProps) {
    const [reason, setReason] = useState('');
    const cancel = useCancelAppointment();

    const handleConfirm = () => {
        cancel.mutate(
            {id: apt.id, data: {reason: reason || 'Cancelado pelo profissional'}},
            {
                onSuccess: () => {
                    toast.success('Consulta cancelada');
                    onCancelled();
                    onClose();
                },
                onError: () => toast.error('Erro ao cancelar consulta'),
            }
        );
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className={styles.cancelDialogWidth}>
                <DialogHeader>
                    <DialogTitle>Cancelar consulta</DialogTitle>
                </DialogHeader>
                <p className={styles.cancelDialogText}>Tem certeza que deseja cancelar esta consulta?</p>
                <div className={cx(styles.formField, mt2)}>
                    <Label>
                        Motivo <span className={styles.optionalLabel}>opcional</span>
                    </Label>
                    <Textarea
                        rows={2}
                        placeholder="Informe o motivo do cancelamento..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <div className={styles.formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Voltar
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={cancel.isPending}>
                        {cancel.isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
