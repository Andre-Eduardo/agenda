import {useEffect, useState} from 'react';
import {
    AxiosError,
    getGetWhatsAppConfigQueryKey,
    useCreateWhatsAppConfig,
    useDeleteWhatsAppConfig,
    useGetWhatsAppConfig,
    useGetWhatsAppQrcode,
    useLogoutWhatsAppConfig,
    type ApiProblem,
    type WhatsAppConfig,
    type WhatsAppConnectionStatus,
} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {LogOut, MessageCircle, Plus, RefreshCw, Smartphone, Trash2} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {useCan} from '@/hooks/useCan';
import {translateApiError} from '@/utils/translate-api-error';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {
    FormCard,
    FormSection,
    PageHeading,
    SkeletonTabContent,
    dialogBody,
    emptyRowText,
    fieldError,
    inlineFormField,
    roomList,
    roomNameText,
    roomRow,
    sectionSub,
    sectionTitle,
    skeletonH10,
    statusBadge,
} from '@/views/modules/settings/pages/index/styles';
import {qrCodeBox, qrCodeImage, rowActions} from './styles';
import {formatPhone, isValidPhone} from './utils';

/** Poll the instance while the QR code is on screen, so the dialog closes once the phone pairs. */
const PAIRING_POLL_INTERVAL = 5_000;

const STATUS_LABELS: Record<WhatsAppConnectionStatus, string> = {
    open: 'Conectado',
    connecting: 'Conectando',
    close: 'Desconectado',
};

const STATUS_TONES: Record<WhatsAppConnectionStatus, 'ok' | 'warning' | 'neutral'> = {
    open: 'ok',
    connecting: 'warning',
    close: 'neutral',
};

function apiErrorDetail(error: unknown): string | null {
    return error instanceof AxiosError ? ((error.response?.data as ApiProblem | undefined)?.detail ?? null) : null;
}

type DialogMode = 'create' | 'connect' | null;

/**
 * WhatsApp number the clinic uses to send appointment reminders (Evolution API, Baileys).
 * Same rules as plexter: one instance per clinic, paired by QR code; connected → disconnect,
 * disconnected → reconnect or remove.
 */
export function WhatsAppSection() {
    const queryClient = useQueryClient();
    const canCreate = useCan({has: 'whatsapp:create'});
    const canConnect = useCan({has: 'whatsapp:connect'});
    const canLogout = useCan({has: 'whatsapp:logout'});
    const canDelete = useCan({has: 'whatsapp:delete'});

    const [dialogMode, setDialogMode] = useState<DialogMode>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [createdQrCode, setCreatedQrCode] = useState<string | undefined>();

    const configQuery = useGetWhatsAppConfig({
        query: {refetchInterval: dialogMode === null ? false : PAIRING_POLL_INTERVAL},
    });
    const instance: WhatsAppConfig | undefined = configQuery.data?.[0];

    const qrCodeQuery = useGetWhatsAppQrcode({
        query: {enabled: dialogMode === 'connect', gcTime: 0, staleTime: 0, retry: false},
    });

    const invalidateConfig = () => queryClient.invalidateQueries({queryKey: getGetWhatsAppConfigQueryKey()});

    const createConfig = useCreateWhatsAppConfig({
        mutation: {
            onSuccess: (data) => {
                setCreatedQrCode(data.qrcode?.base64);
                toast.success('QR Code gerado. Escaneie para conectar o WhatsApp.');
                void invalidateConfig();
            },
            onError: (error) =>
                toast.error(
                    translateApiError(apiErrorDetail(error), 'Não foi possível gerar o QR Code. Tente novamente.')
                ),
        },
    });

    const logoutConfig = useLogoutWhatsAppConfig({
        mutation: {
            onSuccess: () => {
                toast.success('WhatsApp desconectado.');
                void invalidateConfig();
            },
            onError: (error) =>
                toast.error(translateApiError(apiErrorDetail(error), 'Não foi possível desconectar o WhatsApp.')),
        },
    });

    const deleteConfig = useDeleteWhatsAppConfig({
        mutation: {
            onSuccess: () => {
                setConfirmDelete(false);
                toast.success('WhatsApp removido.');
                void invalidateConfig();
            },
            onError: (error) =>
                toast.error(translateApiError(apiErrorDetail(error), 'Não foi possível remover o WhatsApp.')),
        },
    });

    useEffect(() => {
        if (qrCodeQuery.isError) {
            toast.error(
                translateApiError(apiErrorDetail(qrCodeQuery.error), 'Não foi possível obter um novo QR Code.')
            );
        }
    }, [qrCodeQuery.isError, qrCodeQuery.error]);

    const showingQrCode = dialogMode === 'connect' || createdQrCode !== undefined;

    useEffect(() => {
        if (showingQrCode && instance?.status === 'open') {
            toast.success('WhatsApp conectado.');
            setDialogMode(null);
            setPhone('');
            setCreatedQrCode(undefined);
        }
    }, [showingQrCode, instance?.status]);

    function closeDialog() {
        setDialogMode(null);
        setPhone('');
        setPhoneError(null);
        setCreatedQrCode(undefined);
        void invalidateConfig();
    }

    function handleCreate() {
        if (!isValidPhone(phone)) {
            setPhoneError('Informe DDD e número, com 10 ou 11 dígitos.');

            return;
        }

        setPhoneError(null);
        createConfig.mutate({data: {number: phone.replaceAll(/\D/g, '')}});
    }

    const displayQrCode = dialogMode === 'connect' ? qrCodeQuery.data?.base64 : createdQrCode;
    const pairingCode = dialogMode === 'connect' ? qrCodeQuery.data?.pairingCode : null;

    return (
        <div>
            <PageHeading>
                <h1 className="title">WhatsApp</h1>
                <p className="sub">
                    Conecte o número da clínica para enviar lembretes de consulta pelo WhatsApp. O envio sai do servidor
                    de WhatsApp da própria clínica.
                </p>
            </PageHeading>

            <FormCard>
                {configQuery.isLoading ? (
                    <SkeletonTabContent>
                        <Skeleton className={skeletonH10} />
                    </SkeletonTabContent>
                ) : (
                    <FormSection>
                        <div className="sec-head">
                            <span className="sec-num">1</span>
                            <div>
                                <div className={sectionTitle}>Número principal</div>
                                <div className={sectionSub}>
                                    Um número por clínica. Depois de cadastrar, escaneie o QR Code com o WhatsApp do
                                    celular em Aparelhos conectados.
                                </div>
                            </div>
                        </div>

                        {configQuery.isError && (
                            <p className={emptyRowText}>
                                WhatsApp indisponível no momento. Tente novamente em instantes.
                            </p>
                        )}
                        {!configQuery.isError && instance === undefined && (
                            <div className={roomList}>
                                <p className={emptyRowText}>Nenhum WhatsApp cadastrado.</p>
                                {canCreate && (
                                    <div>
                                        <Button size="sm" onClick={() => setDialogMode('create')}>
                                            <Plus size={14} />
                                            Adicionar WhatsApp
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                        {!configQuery.isError && instance !== undefined && (
                            <div className={roomList}>
                                <div className={roomRow} role="group" aria-label="WhatsApp da clínica">
                                    <Smartphone size={14} />
                                    <span className={roomNameText} data-sensitive>
                                        {formatPhone(instance.phoneNumber)}
                                    </span>
                                    <span className={statusBadge({tone: STATUS_TONES[instance.status]})}>
                                        {STATUS_LABELS[instance.status]}
                                    </span>
                                    <div className={rowActions}>
                                        {instance.status === 'open' ? (
                                            canLogout && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={logoutConfig.isPending}
                                                    onClick={() => logoutConfig.mutate()}
                                                >
                                                    <LogOut size={14} />
                                                    Desconectar
                                                </Button>
                                            )
                                        ) : (
                                            <>
                                                {canConnect && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDialogMode('connect')}
                                                    >
                                                        <MessageCircle size={14} />
                                                        Reconectar
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Remover WhatsApp"
                                                        onClick={() => setConfirmDelete(true)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </FormSection>
                )}
            </FormCard>

            <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'connect' ? 'Conectar WhatsApp' : 'Adicionar WhatsApp'}
                        </DialogTitle>
                        {showingQrCode && (
                            <DialogDescription>
                                Abra o WhatsApp no celular, vá em Aparelhos conectados e escaneie o QR Code abaixo.
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {showingQrCode ? (
                        <div className={qrCodeBox}>
                            {displayQrCode ? (
                                <img className={qrCodeImage} src={displayQrCode} alt="QR Code do WhatsApp" />
                            ) : (
                                <Skeleton className={qrCodeImage} />
                            )}
                            {pairingCode && (
                                <p className={sectionSub}>
                                    Ou use o código de pareamento: <strong>{pairingCode}</strong>
                                </p>
                            )}
                            {dialogMode === 'connect' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={qrCodeQuery.isFetching}
                                    onClick={() => void qrCodeQuery.refetch()}
                                >
                                    <RefreshCw size={14} />
                                    Atualizar QR Code
                                </Button>
                            )}
                        </div>
                    ) : (
                        <form
                            className={dialogBody}
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleCreate();
                            }}
                        >
                            <div className={inlineFormField}>
                                <Label htmlFor="whatsapp-phone">Número de telefone</Label>
                                <Input
                                    id="whatsapp-phone"
                                    inputMode="tel"
                                    placeholder="Ex: 11999999999"
                                    value={phone}
                                    aria-invalid={phoneError !== null}
                                    onChange={(event) => setPhone(event.target.value)}
                                />
                                {phoneError && <span className={fieldError}>{phoneError}</span>}
                            </div>
                        </form>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            Fechar
                        </Button>
                        {!showingQrCode && (
                            <Button onClick={handleCreate} disabled={createConfig.isPending}>
                                Conectar
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                opened={confirmDelete}
                title="Remover WhatsApp"
                message="Os lembretes por WhatsApp deixam de ser enviados até um novo número ser conectado. Deseja continuar?"
                confirmLabel="Remover"
                danger
                isLoading={deleteConfig.isPending}
                onConfirm={() => deleteConfig.mutate()}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    );
}
