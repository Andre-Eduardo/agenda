import {useState} from 'react';
import {AxiosError, useCreateSupportUser, type ApiProblem} from '@agenda-app/client';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {formBody, formField, formFooter, formHint} from './SupportUserDialog.styles';

interface SupportUserDialogProps {
    onClose: () => void;
    onCreated: () => void;
}

function extractErrorDetail(error: unknown): string | null {
    if (!(error instanceof AxiosError)) return null;

    return (error.response?.data as ApiProblem | undefined)?.detail ?? null;
}

/** Creates a global support user: enters any clinic, read-only and without clinical data. */
export function SupportUserDialog({onClose, onCreated}: SupportUserDialogProps) {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const createSupportUser = useCreateSupportUser();
    const {isPending} = createSupportUser;
    const canSubmit = !!name && !!username && !!password && !isPending;

    function handleSubmit() {
        if (!canSubmit) return;

        createSupportUser.mutate(
            {data: {name, username, email: email || null, password}},
            {
                onSuccess: () => {
                    toast.success('Usuário de suporte criado');
                    onCreated();
                    onClose();
                },
                onError: (error) => {
                    toast.error(extractErrorDetail(error) ?? 'Erro ao criar usuário de suporte');
                },
            }
        );
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo usuário de suporte</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <span className={formHint}>
                        Entra em qualquer clínica para avaliar a configuração, sem ser funcionário dela. Só leitura e
                        sem acesso a dados clínicos. Cada entrada fica no log de auditoria da clínica.
                    </span>
                    <div className={formField}>
                        <Label htmlFor="support-user-name">Nome</Label>
                        <Input
                            id="support-user-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ana (Suporte)"
                        />
                    </div>
                    <div className={formField}>
                        <Label htmlFor="support-user-username">Nome de usuário</Label>
                        <Input
                            id="support-user-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="suporte.ana"
                        />
                    </div>
                    <div className={formField}>
                        <Label htmlFor="support-user-email">Email (opcional)</Label>
                        <Input
                            id="support-user-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ana@suporte.com"
                        />
                    </div>
                    <div className={formField}>
                        <Label htmlFor="support-user-password">Senha provisória</Label>
                        <Input
                            id="support-user-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <span className={formHint}>
                            Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
                        </span>
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {isPending ? 'Criando…' : 'Criar usuário'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
