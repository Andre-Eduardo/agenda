import {useState} from 'react';
import {
    CreateFinancialAccountDtoType,
    getListFinancialAccountsQueryKey,
    useCreateFinancialAccount,
    useGetAccountStatement,
    useListFinancialAccounts,
    useUpdateFinancialAccount,
    type FinancialAccount,
} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {Plus} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/componentes/table';
import {formatBRL} from '@/lib/utils';
import {Can} from '@/views/components/Can';
import {getApiErrorDetail} from '@/views/modules/appointments/shared/appointment-helpers';
import {amountIn, amountOut, skeletonBlock, statementFilters, statementFooter} from './AccountsTab.styles';
import {
    emptyText,
    formBody,
    formField,
    formFooter,
    row,
    rowActions,
    rowInfo,
    rowMeta,
    rowName,
    section,
    sectionHeader,
    sectionSub,
    sectionTitle,
    wrap,
} from './PlansTab.styles';

const STATEMENT_PAGE_SIZE = 20;

function toDateInput(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

function startOfDay(value: string): string {
    return new Date(`${value}T00:00:00`).toISOString();
}

function endOfDay(value: string): string {
    return new Date(`${value}T23:59:59.999`).toISOString();
}

export function AccountsTab() {
    const {t} = useTranslation();
    const accounts = useListFinancialAccounts();
    const [editing, setEditing] = useState<FinancialAccount | 'new' | null>(null);
    const [statementOf, setStatementOf] = useState<FinancialAccount | null>(null);

    return (
        <div className={wrap}>
            <div className={section}>
                <div className={sectionHeader}>
                    <div>
                        <div className={sectionTitle}>{t('appointmentRevenue.accounts.title')}</div>
                        <div className={sectionSub}>{t('appointmentRevenue.accounts.subtitle')}</div>
                    </div>
                    <Can
                        has="financial-account:manage"
                        granted={
                            <Button size="sm" variant="outline" onClick={() => setEditing('new')}>
                                <Plus />
                                {t('appointmentRevenue.accounts.newAccount')}
                            </Button>
                        }
                    />
                </div>

                {accounts.isPending && <Skeleton className={skeletonBlock} />}
                {accounts.isError && <p className={emptyText}>{t('appointmentRevenue.accounts.loadError')}</p>}
                {(accounts.data ?? []).map((account) => (
                    <AccountRow
                        key={account.id}
                        account={account}
                        onEdit={() => setEditing(account)}
                        onStatement={() => setStatementOf(account)}
                    />
                ))}
            </div>

            {editing !== null && (
                <AccountDialog account={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
            )}
            {statementOf !== null && <StatementDialog account={statementOf} onClose={() => setStatementOf(null)} />}
        </div>
    );
}

function AccountRow({
    account,
    onEdit,
    onStatement,
}: {
    account: FinancialAccount;
    onEdit: () => void;
    onStatement: () => void;
}) {
    const {t} = useTranslation();
    const queryClient = useQueryClient();
    const updateAccount = useUpdateFinancialAccount();

    function toggleActive() {
        updateAccount.mutate(
            {accountId: account.id, data: {name: account.name, active: !account.active}},
            {
                onSuccess: () => {
                    toast.success(t('appointmentRevenue.accounts.saved'));
                    void queryClient.invalidateQueries({queryKey: getListFinancialAccountsQueryKey()});
                },
                onError: (error) => toast.error(getApiErrorDetail(error) ?? t('appointmentRevenue.saveError')),
            }
        );
    }

    return (
        <div className={row}>
            <div className={rowInfo}>
                <span className={rowName}>
                    {account.name}{' '}
                    {account.isDefault && <Badge variant="secondary">{t('appointmentRevenue.accounts.default')}</Badge>}{' '}
                    {!account.active && <Badge variant="warning">{t('appointmentRevenue.accounts.inactive')}</Badge>}
                </span>
                <span className={rowMeta}>
                    {t(`appointmentRevenue.accounts.types.${account.type}`)} ·{' '}
                    {t('appointmentRevenue.accounts.balance')} {formatBRL(account.balanceBrl)}
                </span>
            </div>
            <div className={rowActions}>
                <Button size="sm" variant="ghost" onClick={onStatement}>
                    {t('appointmentRevenue.accounts.statement')}
                </Button>
                <Can
                    has="financial-account:manage"
                    granted={
                        <>
                            <Button size="sm" variant="ghost" onClick={onEdit}>
                                {t('appointmentRevenue.accounts.rename')}
                            </Button>
                            {!account.isDefault && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={updateAccount.isPending}
                                    onClick={toggleActive}
                                >
                                    {account.active
                                        ? t('appointmentRevenue.accounts.deactivate')
                                        : t('appointmentRevenue.accounts.activate')}
                                </Button>
                            )}
                        </>
                    }
                />
            </div>
        </div>
    );
}

function AccountDialog({account, onClose}: {account: FinancialAccount | null; onClose: () => void}) {
    const {t} = useTranslation();
    const queryClient = useQueryClient();
    const createAccount = useCreateFinancialAccount();
    const updateAccount = useUpdateFinancialAccount();
    const [name, setName] = useState(account?.name ?? '');
    const [type, setType] = useState<CreateFinancialAccountDtoType>(account?.type ?? 'BANK');
    const isPending = createAccount.isPending || updateAccount.isPending;

    function done(message: string) {
        toast.success(message);
        void queryClient.invalidateQueries({queryKey: getListFinancialAccountsQueryKey()});
        onClose();
    }

    function handleSave() {
        const trimmed = name.trim();

        if (trimmed === '') {
            toast.error(t('errors.financial_account.name_required'));

            return;
        }

        const onError = (error: unknown) => toast.error(getApiErrorDetail(error) ?? t('appointmentRevenue.saveError'));

        if (account) {
            updateAccount.mutate(
                {accountId: account.id, data: {name: trimmed, active: account.active}},
                {onSuccess: () => done(t('appointmentRevenue.accounts.saved')), onError}
            );

            return;
        }

        createAccount.mutate(
            {data: {name: trimmed, type}},
            {onSuccess: () => done(t('appointmentRevenue.accounts.created')), onError}
        );
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {account
                            ? t('appointmentRevenue.accounts.rename')
                            : t('appointmentRevenue.accounts.newAccount')}
                    </DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label htmlFor="financial-account-name">{t('appointmentRevenue.accounts.name')}</Label>
                        <Input
                            id="financial-account-name"
                            value={name}
                            maxLength={120}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>
                    {!account && (
                        <div className={formField}>
                            <Label htmlFor="financial-account-type">{t('appointmentRevenue.accounts.type')}</Label>
                            <Select
                                value={type}
                                onValueChange={(value: CreateFinancialAccountDtoType) => setType(value)}
                            >
                                <SelectTrigger id="financial-account-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(CreateFinancialAccountDtoType).map((code) => (
                                        <SelectItem key={code} value={code}>
                                            {t(`appointmentRevenue.accounts.types.${code}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className={formFooter}>
                        <Button variant="outline" onClick={onClose}>
                            {t('actions.cancel')}
                        </Button>
                        <Button disabled={isPending} onClick={handleSave}>
                            {account ? t('appointmentRevenue.accounts.save') : t('appointmentRevenue.accounts.create')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StatementDialog({account, onClose}: {account: FinancialAccount; onClose: () => void}) {
    const {t} = useTranslation();
    const today = new Date();
    const [from, setFrom] = useState(toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
    const [to, setTo] = useState(toDateInput(today));
    const [page, setPage] = useState(1);
    const validRange = from !== '' && to !== '' && from <= to;
    const statement = useGetAccountStatement(
        account.id,
        {
            from: validRange ? startOfDay(from) : '',
            to: validRange ? endOfDay(to) : '',
            page,
            pageSize: STATEMENT_PAGE_SIZE,
        },
        {query: {enabled: validRange}}
    );
    const totalPages = Math.max(1, Math.ceil((statement.data?.totalCount ?? 0) / STATEMENT_PAGE_SIZE));

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('appointmentRevenue.accounts.statementTitle', {name: account.name})}</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={statementFilters}>
                        <div className={formField}>
                            <Label htmlFor="statement-from">{t('appointmentRevenue.accounts.fromDate')}</Label>
                            <Input
                                id="statement-from"
                                type="date"
                                value={from}
                                onChange={(event) => {
                                    setFrom(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className={formField}>
                            <Label htmlFor="statement-to">{t('appointmentRevenue.accounts.toDate')}</Label>
                            <Input
                                id="statement-to"
                                type="date"
                                value={to}
                                onChange={(event) => {
                                    setTo(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {statement.isPending && validRange && <Skeleton className={skeletonBlock} />}
                    {statement.data && statement.data.data.length === 0 && (
                        <p className={emptyText}>{t('appointmentRevenue.accounts.emptyStatement')}</p>
                    )}
                    {statement.data && statement.data.data.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('appointmentRevenue.accounts.date')}</TableHead>
                                    <TableHead>{t('appointmentRevenue.accounts.description')}</TableHead>
                                    <TableHead>{t('appointmentRevenue.accounts.amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statement.data.data.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell>{new Date(movement.movedAt).toLocaleString()}</TableCell>
                                        <TableCell>
                                            {t(`appointmentRevenue.ledger.categories.${movement.category}`)} ·{' '}
                                            {t(`appointmentRevenue.methods.${movement.paymentMethod}`)}
                                            {movement.reason ? ` · ${movement.reason}` : ''}
                                        </TableCell>
                                        <TableCell className={movement.direction === 'OUT' ? amountOut : amountIn}>
                                            {movement.direction === 'OUT' ? '−' : '+'}
                                            {formatBRL(movement.amountBrl)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    <div className={statementFooter}>
                        <span className={rowMeta}>
                            {t('appointmentRevenue.accounts.balance')} {formatBRL(account.balanceBrl)}
                        </span>
                        {totalPages > 1 && (
                            <div className={rowActions}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    {t('appointmentRevenue.accounts.previous')}
                                </Button>
                                <span className={rowMeta}>
                                    {t('appointmentRevenue.accounts.pagination', {page, totalPages})}
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    {t('appointmentRevenue.accounts.next')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
