import {useId, useState} from 'react';
import type {AccountMovement, FinancialAccount} from '@agenda-app/client';
import {
    getGetPaymentLedgerQueryKey,
    getListFinancialAccountsQueryKey,
    ReceivePaymentDtoPartsItemPaymentMethod,
    useGetPaymentLedger,
    useListFinancialAccounts,
    useReceivePayment,
    useRefundPayment,
} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {Plus, Trash2} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {Textarea} from '@/components/ui/componentes/textarea';
import {useCan} from '@/hooks/useCan';
import {formatBRL} from '@/lib/utils';
import {getApiErrorDetail} from '../../shared/appointment-helpers';
import * as styles from '../../styles';
import * as ledgerStyles from './styles';

export type LedgerMethod = ReceivePaymentDtoPartsItemPaymentMethod;

export const LEDGER_METHODS = Object.values(ReceivePaymentDtoPartsItemPaymentMethod);

export function isLedgerMethod(method: string): method is LedgerMethod {
    return LEDGER_METHODS.some((code) => code === method);
}

const DEFAULT_ACCOUNT = '__default__';
const AMOUNT_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

export interface ReceiptPartDraft {
    key: number;
    paymentMethod: LedgerMethod;
    amount: string;
    accountId: string;
}

let nextPartKey = 1;

export function newReceiptPart(paymentMethod: LedgerMethod, amount: string): ReceiptPartDraft {
    nextPartKey += 1;

    return {key: nextPartKey, paymentMethod, amount, accountId: DEFAULT_ACCOUNT};
}

/** Converts the drafts to API parts, or null when an amount is invalid. */
export function toReceiptParts(parts: ReceiptPartDraft[]) {
    if (parts.length === 0 || parts.some((part) => !AMOUNT_PATTERN.test(part.amount.trim()))) {
        return null;
    }

    const converted = parts.map((part) => ({
        paymentMethod: part.paymentMethod,
        amountBrl: Number(part.amount.trim().replace(',', '.')),
        accountId: part.accountId === DEFAULT_ACCOUNT ? null : part.accountId,
    }));

    return converted.some((part) => part.amountBrl <= 0) ? null : converted;
}

function partsTotalCents(parts: ReceiptPartDraft[]): number {
    return parts.reduce((sum, part) => {
        const value = Number(part.amount.trim().replace(',', '.'));

        return Number.isFinite(value) ? sum + Math.round(value * 100) : sum;
    }, 0);
}

/** Active accounts, only when the member may see them. */
export function useReceivingAccounts(enabled: boolean): FinancialAccount[] {
    const canView = useCan({has: 'financial-account:view'});
    const accounts = useListFinancialAccounts({query: {enabled: enabled && canView}});

    return (accounts.data ?? []).filter((account) => account.active);
}

export function ReceiptPartsEditor({
    parts,
    onChange,
    accounts,
    expectedBrl,
}: {
    parts: ReceiptPartDraft[];
    onChange: (parts: ReceiptPartDraft[]) => void;
    accounts: FinancialAccount[];
    expectedBrl: number | null;
}) {
    const {t} = useTranslation();
    const baseId = useId();

    function change(key: number, patch: Partial<ReceiptPartDraft>) {
        onChange(parts.map((part) => (part.key === key ? {...part, ...patch} : part)));
    }

    return (
        <div className={ledgerStyles.parts}>
            {parts.map((part, index) => (
                <div key={part.key} className={ledgerStyles.partRow}>
                    <div className={styles.sheetKv}>
                        <Label htmlFor={`${baseId}-method-${part.key}`}>{t('appointmentRevenue.method')}</Label>
                        <Select
                            value={part.paymentMethod}
                            onValueChange={(value: LedgerMethod) => change(part.key, {paymentMethod: value})}
                        >
                            <SelectTrigger id={`${baseId}-method-${part.key}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LEDGER_METHODS.map((code) => (
                                    <SelectItem key={code} value={code}>
                                        {t(`appointmentRevenue.methods.${code}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className={styles.sheetKv}>
                        <Label htmlFor={`${baseId}-amount-${part.key}`}>{t('appointmentRevenue.amount')}</Label>
                        <Input
                            id={`${baseId}-amount-${part.key}`}
                            inputMode="decimal"
                            value={part.amount}
                            onChange={(event) => change(part.key, {amount: event.target.value})}
                        />
                    </div>
                    {accounts.length > 0 && (
                        <div className={styles.sheetKv}>
                            <Label htmlFor={`${baseId}-account-${part.key}`}>
                                {t('appointmentRevenue.ledger.account')}
                            </Label>
                            <Select
                                value={part.accountId}
                                onValueChange={(value) => change(part.key, {accountId: value})}
                            >
                                <SelectTrigger id={`${baseId}-account-${part.key}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={DEFAULT_ACCOUNT}>
                                        {t('appointmentRevenue.ledger.defaultAccount')}
                                    </SelectItem>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {parts.length > 1 && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className={ledgerStyles.removePart}
                            aria-label={`${t('appointmentRevenue.ledger.removePart')} ${index + 1}`}
                            onClick={() => onChange(parts.filter((item) => item.key !== part.key))}
                        >
                            <Trash2 className={styles.icon35} />
                        </Button>
                    )}
                </div>
            ))}
            <div className={ledgerStyles.partsFooter}>
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={parts.length >= 10}
                    onClick={() => onChange([...parts, newReceiptPart('CASH', '')])}
                >
                    <Plus className={styles.icon35} />
                    {t('appointmentRevenue.ledger.addPart')}
                </Button>
                {expectedBrl !== null && parts.length > 1 && (
                    <span className={ledgerStyles.partsTotal}>
                        {t('appointmentRevenue.ledger.partsTotal', {
                            total: formatBRL(partsTotalCents(parts) / 100),
                            expected: formatBRL(expectedBrl),
                        })}
                    </span>
                )}
            </div>
        </div>
    );
}

function MovementRow({movement}: {movement: AccountMovement}) {
    const {t} = useTranslation();
    const isOut = movement.direction === 'OUT';

    return (
        <li className={ledgerStyles.movement}>
            <div className={ledgerStyles.movementMain}>
                <span className={styles.sheetKvText}>
                    {t(`appointmentRevenue.ledger.categories.${movement.category}`)} ·{' '}
                    {t(`appointmentRevenue.methods.${movement.paymentMethod}`)}
                </span>
                <span className={styles.sheetKvKey}>
                    {new Date(movement.movedAt).toLocaleString()}
                    {movement.accountName ? ` · ${movement.accountName}` : ''}
                    {movement.reason ? ` · ${movement.reason}` : ''}
                </span>
            </div>
            <span className={isOut ? ledgerStyles.amountOut : ledgerStyles.amountIn}>
                {isOut ? '−' : '+'}
                {formatBRL(movement.amountBrl)}
            </span>
        </li>
    );
}

/** Receipts, refunds and the remaining balance of a payment that moves money. */
export function PaymentLedgerPanel({appointmentId, onChanged}: {appointmentId: string; onChanged: () => void}) {
    const {t} = useTranslation();
    const queryClient = useQueryClient();
    const canRegister = useCan({has: 'appointment-payment:register'});
    const canRefund = useCan({has: 'appointment-payment:refund'});
    const ledger = useGetPaymentLedger(appointmentId);
    const receivePayment = useReceivePayment();
    const refundPayment = useRefundPayment();
    const [parts, setParts] = useState<ReceiptPartDraft[] | null>(null);
    const [refundOpen, setRefundOpen] = useState(false);
    const [reason, setReason] = useState('');
    const accounts = useReceivingAccounts(parts !== null);
    const reasonId = useId();

    const {data} = ledger;

    if (!data?.tracked) {
        return null;
    }

    const isRefunded = data.payment.status === 'REFUNDED';
    const mayReceive = canRegister && !isRefunded && data.remainingBrl > 0;
    const mayRefund = canRefund && !isRefunded && data.receivedBrl > 0;

    function refresh() {
        void queryClient.invalidateQueries({queryKey: getGetPaymentLedgerQueryKey(appointmentId)});
        void queryClient.invalidateQueries({queryKey: getListFinancialAccountsQueryKey()});
        onChanged();
    }

    function startReceiving() {
        if (!data) return;

        const lastMethod = data.payment.paymentMethod;

        setParts([newReceiptPart(isLedgerMethod(lastMethod) ? lastMethod : 'PIX', data.remainingBrl.toFixed(2))]);
    }

    function handleReceive() {
        const payload = parts ? toReceiptParts(parts) : null;

        if (!payload) {
            toast.error(t('appointmentRevenue.invalidAmount'));

            return;
        }

        receivePayment.mutate(
            {id: appointmentId, data: {parts: payload}},
            {
                onSuccess: () => {
                    toast.success(t('appointmentRevenue.ledger.received'));
                    setParts(null);
                    refresh();
                },
                onError: (error) => toast.error(getApiErrorDetail(error) ?? t('appointmentRevenue.saveError')),
            }
        );
    }

    function handleRefund() {
        if (reason.trim() === '') {
            toast.error(t('appointmentRevenue.ledger.refundReasonRequired'));

            return;
        }

        refundPayment.mutate(
            {id: appointmentId, data: {reason: reason.trim()}},
            {
                onSuccess: () => {
                    toast.success(t('appointmentRevenue.ledger.refunded'));
                    setRefundOpen(false);
                    setReason('');
                    refresh();
                },
                onError: (error) => toast.error(getApiErrorDetail(error) ?? t('appointmentRevenue.saveError')),
            }
        );
    }

    return (
        <div className={ledgerStyles.panel}>
            <div className={ledgerStyles.panelHeader}>
                <span className={styles.sheetKvKey}>{t('appointmentRevenue.ledger.movements')}</span>
                {data.remainingBrl > 0 && !isRefunded && (
                    <Badge variant="warning">
                        {t('appointmentRevenue.ledger.remaining')}: {formatBRL(data.remainingBrl)}
                    </Badge>
                )}
            </div>
            {data.movements.length === 0 ? (
                <p className={styles.sheetNotesEmpty}>{t('appointmentRevenue.ledger.noMovements')}</p>
            ) : (
                <ul className={ledgerStyles.movements}>
                    {data.movements.map((movement) => (
                        <MovementRow key={movement.id} movement={movement} />
                    ))}
                </ul>
            )}

            {parts !== null && (
                <>
                    <ReceiptPartsEditor
                        parts={parts}
                        onChange={setParts}
                        accounts={accounts}
                        expectedBrl={data.remainingBrl}
                    />
                    <div className={styles.gap1_5}>
                        <Button size="sm" disabled={receivePayment.isPending} onClick={handleReceive}>
                            {t('appointmentRevenue.ledger.receive')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setParts(null)}>
                            {t('actions.cancel')}
                        </Button>
                    </div>
                </>
            )}

            {parts === null && (mayReceive || mayRefund) && (
                <div className={ledgerStyles.actions}>
                    {mayReceive && (
                        <Button size="sm" variant="outline" onClick={startReceiving}>
                            {t('appointmentRevenue.ledger.receiveRest')}
                        </Button>
                    )}
                    {mayRefund && (
                        <Button size="sm" variant="ghost" onClick={() => setRefundOpen(true)}>
                            {t('appointmentRevenue.ledger.refund')}
                        </Button>
                    )}
                </div>
            )}

            <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
                <DialogContent className={styles.cancelDialogWidth}>
                    <DialogHeader>
                        <DialogTitle>{t('appointmentRevenue.ledger.refundTitle')}</DialogTitle>
                        <DialogDescription>{t('appointmentRevenue.ledger.refundDescription')}</DialogDescription>
                    </DialogHeader>
                    <div className={styles.sheetKv}>
                        <Label htmlFor={reasonId}>{t('appointmentRevenue.ledger.refundReason')}</Label>
                        <Textarea
                            id={reasonId}
                            value={reason}
                            maxLength={500}
                            onChange={(event) => setReason(event.target.value)}
                        />
                    </div>
                    <div className={ledgerStyles.actions}>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={refundPayment.isPending}
                            onClick={handleRefund}
                        >
                            {t('appointmentRevenue.ledger.refund')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRefundOpen(false)}>
                            {t('actions.cancel')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
