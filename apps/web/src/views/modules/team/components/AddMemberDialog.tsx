import {useState} from 'react';
import {
    AxiosError,
    useInviteClinicMember,
    useSignUp,
    type ClinicMemberRolesItem,
    type ApiProblem,
} from '@agenda-app/client';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {formBody, formField, formFooter, formHint, roleChip, roleChipRow} from './AddMemberDialog.styles';

interface AddMemberDialogProps {
    onClose: () => void;
    onCreated: () => void;
}

type AssignableRole = Exclude<ClinicMemberRolesItem, 'OWNER'>;

const ASSIGNABLE_ROLES: AssignableRole[] = ['ADMIN', 'PROFESSIONAL', 'SECRETARY', 'VIEWER'];

const ASSIGNABLE_ROLE_LABELS: Record<AssignableRole, string> = {
    ADMIN: 'Administrador(a)',
    PROFESSIONAL: 'Profissional',
    SECRETARY: 'Secretária(o)',
    VIEWER: 'Visualizador(a)',
};

const MEMBER_COLORS = ['#4F81BD', '#8E6FCE', '#4FA37D', '#D98E4A', '#C25B6B', '#4A9BB0'];

function randomMemberColor(): string {
    return MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)] ?? MEMBER_COLORS[0];
}

function extractErrorDetail(error: unknown): string | null {
    if (!(error instanceof AxiosError)) return null;

    return (error.response?.data as ApiProblem | undefined)?.detail ?? null;
}

export function AddMemberDialog({onClose, onCreated}: AddMemberDialogProps) {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roles, setRoles] = useState<AssignableRole[]>(['PROFESSIONAL']);

    const signUp = useSignUp();
    const inviteMember = useInviteClinicMember();

    const isPending = signUp.isPending || inviteMember.isPending;
    const canSubmit = !!name && !!username && !!email && !!password && roles.length > 0 && !isPending;

    function toggleRole(role: AssignableRole) {
        setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
    }

    function handleSubmit() {
        if (!canSubmit) return;

        signUp.mutate(
            {data: {name, username, email, password}},
            {
                onSuccess: (user) => {
                    inviteMember.mutate(
                        {data: {userId: user.id, roles, displayName: name, color: randomMemberColor()}},
                        {
                            onSuccess: () => {
                                toast.success('Membro adicionado à clínica');
                                onCreated();
                                onClose();
                            },
                            onError: (error) => {
                                toast.error(extractErrorDetail(error) ?? 'Erro ao adicionar membro à clínica');
                            },
                        }
                    );
                },
                onError: (error) => {
                    toast.error(extractErrorDetail(error) ?? 'Erro ao criar usuário');
                },
            }
        );
    }

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar membro</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label>Nome completo</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria Silva" />
                    </div>
                    <div className={formField}>
                        <Label>Nome de usuário</Label>
                        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="maria" />
                    </div>
                    <div className={formField}>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="maria@clinica.com"
                        />
                    </div>
                    <div className={formField}>
                        <Label>Senha provisória</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <span className={formHint}>
                            Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
                        </span>
                    </div>
                    <div className={formField}>
                        <Label>
                            Papéis na clínica <span className={formHint}>(um membro pode acumular mais de um)</span>
                        </Label>
                        <div className={roleChipRow}>
                            {ASSIGNABLE_ROLES.map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    aria-pressed={roles.includes(role)}
                                    className={roleChip({active: roles.includes(role)})}
                                    onClick={() => toggleRole(role)}
                                >
                                    {ASSIGNABLE_ROLE_LABELS[role]}
                                </button>
                            ))}
                        </div>
                        {roles.length === 0 && <span className={formHint}>Selecione ao menos um papel.</span>}
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {isPending ? 'Adicionando…' : 'Adicionar membro'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
