import {useState} from 'react';
import {
    AxiosError,
    useAuthorize,
    useListClaims,
    useMarkPaid,
    useRegisterGlosa,
    useSubmit,
    type ApiProblem,
    type InsuranceClaim,
} from '@agenda-app/client';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {translateApiError} from '@/utils/translate-api-error';
import {Can} from '@/views/components/Can';
import {actions, amount, formBody, formFooter, info, meta, name, row} from './InsuranceClaimsSection.styles';

type ClaimAction = 'AUTHORIZE' | 'PAID' | 'GLOSA';

const CLAIM_STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Rascunho',
    SUBMITTED: 'Enviada',
    PAID: 'Paga',
    PARTIALLY_PAID: 'Paga parcialmente',
    DENIED: 'Negada',
    APPEALED: 'Em recurso',
    CANCELLED: 'Cancelada',
};

function formatBRL(value: number): string {
    return `R$ ${value.toFixed(2)}`;
}

function errorDetail(error: unknown, fallback: string): string {
    if (!(error instanceof AxiosError)) return fallback;

    const detail = (error.response?.data as ApiProblem | undefined)?.detail;

    return translateApiError(detail, fallback);
}

export function InsuranceClaimsSection() {
    const claimsQuery = useListClaims({claimStatus: []});
    const submit = useSubmit();
    const [action, setAction] = useState<{claim: InsuranceClaim; type: ClaimAction} | null>(null);
    const claims = claimsQuery.data ?? [];

    function handleSubmit(claim: InsuranceClaim) {
        submit.mutate(
            {id: claim.id},
            {
                onSuccess: () => {
                    toast.success('Guia enviada para análise');
                    void claimsQuery.refetch();
                },
                onError: (error) => toast.error(errorDetail(error, 'Não foi possível enviar a guia.')),
            }
        );
    }

    return (
        <section>
            <div className={row}>
                <div className={info}>
                    <span className={name}>Guias de convênio</span>
                    <span className={meta}>Acompanhe autorização, envio, pagamento e glosa.</span>
                </div>
            </div>

            {claimsQuery.isLoading && <p className={meta}>Carregando guias…</p>}
            {!claimsQuery.isLoading && claims.length === 0 && (
                <p className={meta}>Nenhuma guia de convênio cadastrada.</p>
            )}
            {!claimsQuery.isLoading &&
                claims.length > 0 &&
                claims.map((claim) => (
                    <div key={claim.id} className={row}>
                        <div className={info}>
                            <span className={name}>Guia {claim.id.slice(0, 8)}</span>
                            <span className={amount}>
                                Enviada: {formatBRL(claim.submittedAmountBrl)}
                                {claim.approvedAmountBrl !== null
                                    ? ` · Aprovada: ${formatBRL(claim.approvedAmountBrl)}`
                                    : ''}
                            </span>
                            {claim.glosaReason !== null && <span className={meta}>Glosa: {claim.glosaReason}</span>}
                        </div>
                        <div className={actions}>
                            <Badge variant={claim.claimStatus === 'PAID' ? 'success' : 'secondary'}>
                                {CLAIM_STATUS_LABELS[claim.claimStatus] ?? claim.claimStatus}
                            </Badge>
                            <Can has="insurance-claim:update">
                                {claim.claimStatus === 'DRAFT' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={submit.isPending}
                                        onClick={() => handleSubmit(claim)}
                                    >
                                        Enviar guia
                                    </Button>
                                )}
                                {(claim.claimStatus === 'SUBMITTED' || claim.claimStatus === 'APPEALED') && (
                                    <>
                                        {claim.authorizationCode === null && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setAction({claim, type: 'AUTHORIZE'})}
                                            >
                                                Autorizar
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setAction({claim, type: 'PAID'})}
                                        >
                                            Registrar pagamento
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setAction({claim, type: 'GLOSA'})}
                                        >
                                            Registrar glosa
                                        </Button>
                                    </>
                                )}
                            </Can>
                        </div>
                    </div>
                ))}

            {action !== null && (
                <ClaimActionDialog
                    action={action}
                    onClose={() => setAction(null)}
                    onUpdated={() => void claimsQuery.refetch()}
                />
            )}
        </section>
    );
}

function ClaimActionDialog({
    action,
    onClose,
    onUpdated,
}: {
    action: {claim: InsuranceClaim; type: ClaimAction};
    onClose: () => void;
    onUpdated: () => void;
}) {
    const authorize = useAuthorize();
    const markPaid = useMarkPaid();
    const registerGlosa = useRegisterGlosa();
    const [authorizationCode, setAuthorizationCode] = useState('');
    const [approvedAmount, setApprovedAmount] = useState(String(action.claim.submittedAmountBrl));
    const [glosaAmount, setGlosaAmount] = useState('0');
    const [reason, setReason] = useState('');
    const pending = authorize.isPending || markPaid.isPending || registerGlosa.isPending;

    function finish(success: string) {
        toast.success(success);
        onUpdated();
        onClose();
    }

    function handleSubmit() {
        if (action.type === 'AUTHORIZE') {
            if (!authorizationCode.trim()) return;

            authorize.mutate(
                {id: action.claim.id, data: {authorizationCode: authorizationCode.trim()}},
                {
                    onSuccess: () => finish('Autorização registrada'),
                    onError: (error) => toast.error(errorDetail(error, 'Não foi possível registrar a autorização.')),
                }
            );

            return;
        }

        const approvedAmountBrl = Number(approvedAmount.replace(',', '.'));

        if (!Number.isFinite(approvedAmountBrl) || approvedAmountBrl < 0) return;

        if (action.type === 'PAID') {
            if (approvedAmountBrl <= 0) return;

            markPaid.mutate(
                {id: action.claim.id, data: {approvedAmountBrl}},
                {
                    onSuccess: () => finish('Pagamento da guia registrado'),
                    onError: (error) => toast.error(errorDetail(error, 'Não foi possível registrar o pagamento.')),
                }
            );

            return;
        }

        const glosaAmountBrl = Number(glosaAmount.replace(',', '.'));

        if (!reason.trim() || !Number.isFinite(glosaAmountBrl) || glosaAmountBrl < 0) return;

        registerGlosa.mutate(
            {id: action.claim.id, data: {reason: reason.trim(), glosaAmountBrl, approvedAmountBrl}},
            {
                onSuccess: () => finish('Glosa registrada'),
                onError: (error) => toast.error(errorDetail(error, 'Não foi possível registrar a glosa.')),
            }
        );
    }

    const titleByAction: Record<ClaimAction, string> = {
        AUTHORIZE: 'Registrar autorização',
        PAID: 'Registrar pagamento da guia',
        GLOSA: 'Registrar glosa',
    };
    const title = titleByAction[action.type];

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    {action.type === 'AUTHORIZE' ? (
                        <div>
                            <Label>Código de autorização</Label>
                            <Input
                                value={authorizationCode}
                                onChange={(event) => setAuthorizationCode(event.target.value)}
                            />
                        </div>
                    ) : (
                        <div>
                            <Label>Valor aprovado (R$)</Label>
                            <Input value={approvedAmount} onChange={(event) => setApprovedAmount(event.target.value)} />
                        </div>
                    )}
                    {action.type === 'GLOSA' && (
                        <>
                            <div>
                                <Label>Motivo da glosa</Label>
                                <Input value={reason} onChange={(event) => setReason(event.target.value)} />
                            </div>
                            <div>
                                <Label>Valor glosado (R$)</Label>
                                <Input value={glosaAmount} onChange={(event) => setGlosaAmount(event.target.value)} />
                            </div>
                        </>
                    )}
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button disabled={pending} onClick={handleSubmit}>
                        Salvar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
