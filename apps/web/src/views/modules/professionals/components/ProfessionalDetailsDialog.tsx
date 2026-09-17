import {useState} from 'react';
import {
    AxiosError,
    useCreateProfessional,
    useUpdateProfessional,
    type ApiProblem,
    type ClinicMember,
    type Professional,
    type ProfessionalSpecialtyNormalized,
} from '@agenda-app/client';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {formBody, formField, formFooter} from './ProfessionalDetailsDialog.styles';

interface ProfessionalDetailsDialogProps {
    member: ClinicMember;
    professional: Professional | null;
    onClose: () => void;
    onSaved: () => void;
}

const NO_SPECIALTY = '__none__';

const SPECIALTY_OPTIONS: Array<{value: ProfessionalSpecialtyNormalized; label: string}> = [
    {value: 'SAUDE_MENTAL', label: 'Saúde Mental'},
    {value: 'REABILITACAO', label: 'Reabilitação'},
    {value: 'MEDICINA_GERAL', label: 'Medicina Geral'},
    {value: 'MEDICINA_ESPECIALIZADA', label: 'Medicina Especializada'},
    {value: 'NUTRICAO_DIETETICA', label: 'Nutrição/Dietética'},
    {value: 'ENFERMAGEM', label: 'Enfermagem'},
    {value: 'OUTROS', label: 'Outros'},
];

function extractErrorDetail(error: unknown): string | null {
    if (!(error instanceof AxiosError)) return null;

    return (error.response?.data as ApiProblem | undefined)?.detail ?? null;
}

export function ProfessionalDetailsDialog({member, professional, onClose, onSaved}: ProfessionalDetailsDialogProps) {
    const [registrationNumber, setRegistrationNumber] = useState(professional?.registrationNumber ?? '');
    const [specialty, setSpecialty] = useState(professional?.specialty ?? '');
    const [specialtyNormalized, setSpecialtyNormalized] = useState<ProfessionalSpecialtyNormalized>(
        professional?.specialtyNormalized ?? null
    );

    const createProfessional = useCreateProfessional();
    const updateProfessional = useUpdateProfessional();

    const isPending = createProfessional.isPending || updateProfessional.isPending;

    function handleSubmit() {
        const data = {
            registrationNumber: registrationNumber || null,
            specialty: specialty || null,
            specialtyNormalized,
        };

        const onSuccess = () => {
            toast.success('Dados do profissional salvos');
            onSaved();
        };

        const onError = (error: unknown) => {
            toast.error(extractErrorDetail(error) ?? 'Erro ao salvar dados do profissional');
        };

        if (professional) {
            updateProfessional.mutate(
                {id: professional.id, data: {...data, defaultRoomId: professional.defaultRoomId ?? null}},
                {onSuccess, onError}
            );
        } else {
            createProfessional.mutate({memberId: member.id, data}, {onSuccess, onError});
        }
    }

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{member.displayName ?? 'Profissional'}</DialogTitle>
                </DialogHeader>
                <div className={formBody}>
                    <div className={formField}>
                        <Label>Número de registro</Label>
                        <Input
                            value={registrationNumber}
                            onChange={(e) => setRegistrationNumber(e.target.value)}
                            placeholder="CRM-SP 12345"
                        />
                    </div>
                    <div className={formField}>
                        <Label>Especialidade</Label>
                        <Input
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="Cardiologia"
                        />
                    </div>
                    <div className={formField}>
                        <Label>
                            Grupo de especialidade <span>(usado pelos agentes de IA clínicos)</span>
                        </Label>
                        <Select
                            value={specialtyNormalized ?? NO_SPECIALTY}
                            onValueChange={(v) =>
                                setSpecialtyNormalized(
                                    v === NO_SPECIALTY ? null : (v as ProfessionalSpecialtyNormalized)
                                )
                            }
                        >
                            <SelectTrigger aria-label="Grupo de especialidade">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_SPECIALTY}>Não definido</SelectItem>
                                {SPECIALTY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value ?? ''} value={opt.value ?? ''}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className={formFooter}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? 'Salvando…' : 'Salvar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
