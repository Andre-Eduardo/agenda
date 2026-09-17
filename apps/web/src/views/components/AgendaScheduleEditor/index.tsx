import {useState} from 'react';
import {
    useCreateMemberBlock,
    useDeleteMemberBlock,
    useListMemberBlocks,
    useListWorkingHours,
    useUpsertWorkingHours,
    type WorkingHours,
} from '@agenda-app/client';
import {CalendarX, Plus, Trash2} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/componentes/dialog';
import {Field} from '@/components/ui/componentes/field';
import {Input} from '@/components/ui/componentes/input';
import {SegmentedControl, SegmentedControlItem} from '@/components/ui/componentes/segmented-control';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {
    Section,
    blockDates,
    blockForm,
    blockList,
    blockRow,
    mt4,
    root,
    sectionSub,
    sectionTitle,
    weekDayLabel,
    weekDayRow,
    weekDaySaveBtn,
    weekDaySep,
    weekDaySlotInput,
    weekDayTimeInput,
    weekList,
} from './styles';

const WEEKDAYS = [
    {value: 0, label: 'Domingo'},
    {value: 1, label: 'Segunda-feira'},
    {value: 2, label: 'Terça-feira'},
    {value: 3, label: 'Quarta-feira'},
    {value: 4, label: 'Quinta-feira'},
    {value: 5, label: 'Sexta-feira'},
    {value: 6, label: 'Sábado'},
] as const;

const DEFAULT_START_TIME = '08:00';
const DEFAULT_END_TIME = '17:00';
const DEFAULT_SLOT_DURATION = 30;

function formatBlockRange(startAt: string, endAt: string): string {
    const fmt = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${fmt.format(new Date(startAt))} → ${fmt.format(new Date(endAt))}`;
}

export interface AgendaScheduleEditorProps {
    /** ClinicMember whose working hours/blocks are being managed (self or another member). */
    memberId: string;
}

/**
 * Editor de expediente semanal + bloqueios de agenda de um ClinicMember.
 * Usado tanto no self-service (Settings) quanto na gestão de equipe (Team),
 * bastando trocar o `memberId` informado.
 */
export function AgendaScheduleEditor({memberId}: AgendaScheduleEditorProps) {
    const hoursQuery = useListWorkingHours(memberId);
    const blocksQuery = useListMemberBlocks(memberId, {startAt: null, endAt: null});

    const upsertHours = useUpsertWorkingHours();
    const createBlock = useCreateMemberBlock();
    const deleteBlock = useDeleteMemberBlock();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [blockStart, setBlockStart] = useState('');
    const [blockEnd, setBlockEnd] = useState('');
    const [blockReason, setBlockReason] = useState('');

    const isLoading = hoursQuery.isLoading || blocksQuery.isLoading;

    function handleSaveDay(
        dayOfWeek: number,
        values: {active: boolean; startTime: string; endTime: string; slotDuration: number}
    ) {
        upsertHours.mutate(
            {memberId, data: {dayOfWeek, ...values}},
            {
                onSuccess: () => {
                    toast.success('Expediente atualizado');
                    void hoursQuery.refetch();
                },
                onError: () => toast.error('Erro ao salvar expediente.'),
            }
        );
    }

    function handleCreateBlock() {
        if (!blockStart || !blockEnd) return;

        createBlock.mutate(
            {
                memberId,
                data: {
                    startAt: new Date(blockStart).toISOString(),
                    endAt: new Date(blockEnd).toISOString(),
                    reason: blockReason || null,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Bloqueio criado');
                    setDialogOpen(false);
                    setBlockStart('');
                    setBlockEnd('');
                    setBlockReason('');
                    void blocksQuery.refetch();
                },
                onError: () => toast.error('Erro ao criar bloqueio. Verifique as datas informadas.'),
            }
        );
    }

    function handleDeleteBlock(blockId: string) {
        deleteBlock.mutate(
            {memberId, blockId},
            {
                onSuccess: () => {
                    toast.success('Bloqueio removido');
                    void blocksQuery.refetch();
                },
                onError: () => toast.error('Erro ao remover bloqueio.'),
            }
        );
    }

    if (isLoading) {
        return (
            <div className={root}>
                <Skeleton className={mt4} style={{height: '2.5rem'}} />
                <Skeleton className={mt4} style={{height: '2.5rem'}} />
                <Skeleton className={mt4} style={{height: '2.5rem'}} />
            </div>
        );
    }

    return (
        <div className={root}>
            <Section>
                <div className="head">
                    <span className={sectionTitle}>Expediente semanal</span>
                </div>
                <p className={sectionSub}>
                    Horários usados como referência para o agendamento. Consultas fora do expediente ainda podem ser
                    criadas, mas geram um aviso de confirmação.
                </p>

                <div className={mt4}>
                    <div className={weekList}>
                        {WEEKDAYS.map((day) => (
                            <WeekDayRow
                                key={day.value}
                                label={day.label}
                                existing={hoursQuery.data?.find((wh) => wh.dayOfWeek === day.value) ?? null}
                                saving={upsertHours.isPending}
                                onSave={(values) => handleSaveDay(day.value, values)}
                            />
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="head">
                    <CalendarX size={14} className="icon" />
                    Bloqueios de agenda
                    <span className="tag">{blocksQuery.data?.length ?? 0} bloqueio(s)</span>
                </div>

                <div className={blockList}>
                    {(blocksQuery.data ?? []).length === 0 && <p className={sectionSub}>Nenhum bloqueio cadastrado.</p>}
                    {(blocksQuery.data ?? []).map((block) => (
                        <div key={block.id} className={blockRow}>
                            <div>
                                <div className={blockDates}>{formatBlockRange(block.startAt, block.endAt)}</div>
                                {block.reason && <div className={sectionSub}>{block.reason}</div>}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Remover bloqueio: ${block.reason ?? formatBlockRange(block.startAt, block.endAt)}`}
                                disabled={deleteBlock.isPending}
                                onClick={() => handleDeleteBlock(block.id)}
                            >
                                <Trash2 size={13} />
                            </Button>
                        </div>
                    ))}
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus size={13} />
                            Novo bloqueio
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo bloqueio de agenda</DialogTitle>
                        </DialogHeader>
                        <div className={blockForm}>
                            <Field label="Início" required>
                                <Input
                                    type="datetime-local"
                                    aria-label="Início"
                                    value={blockStart}
                                    onChange={(e) => setBlockStart(e.target.value)}
                                />
                            </Field>
                            <Field label="Fim" required>
                                <Input
                                    type="datetime-local"
                                    aria-label="Fim"
                                    value={blockEnd}
                                    onChange={(e) => setBlockEnd(e.target.value)}
                                />
                            </Field>
                            <Field label="Motivo" optional>
                                <Input
                                    placeholder="Ex.: Férias, congresso…"
                                    aria-label="Motivo"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                />
                            </Field>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                disabled={!blockStart || !blockEnd || createBlock.isPending}
                                onClick={handleCreateBlock}
                            >
                                {createBlock.isPending ? 'Criando…' : 'Criar bloqueio'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Section>
        </div>
    );
}

function WeekDayRow({
    label,
    existing,
    saving,
    onSave,
}: {
    label: string;
    existing: WorkingHours | null;
    saving: boolean;
    onSave: (values: {active: boolean; startTime: string; endTime: string; slotDuration: number}) => void;
}) {
    const [active, setActive] = useState(existing?.active ?? false);
    const [startTime, setStartTime] = useState(existing?.startTime ?? DEFAULT_START_TIME);
    const [endTime, setEndTime] = useState(existing?.endTime ?? DEFAULT_END_TIME);
    const [slotDuration, setSlotDuration] = useState(existing?.slotDuration ?? DEFAULT_SLOT_DURATION);
    const [initialized, setInitialized] = useState(false);

    if (existing && !initialized) {
        setActive(existing.active);
        setStartTime(existing.startTime);
        setEndTime(existing.endTime);
        setSlotDuration(existing.slotDuration);
        setInitialized(true);
    }

    const dirty =
        !existing ||
        existing.active !== active ||
        existing.startTime !== startTime ||
        existing.endTime !== endTime ||
        existing.slotDuration !== slotDuration;

    return (
        <div className={weekDayRow} role="group" aria-label={label}>
            <SegmentedControl value={active ? 'on' : 'off'} onValueChange={(v) => setActive(v === 'on')}>
                <SegmentedControlItem value="on">Ativo</SegmentedControlItem>
                <SegmentedControlItem value="off">Inativo</SegmentedControlItem>
            </SegmentedControl>
            <span className={weekDayLabel}>{label}</span>
            {active && (
                <>
                    <Input
                        type="time"
                        aria-label="Início"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className={weekDayTimeInput}
                    />
                    <span className={weekDaySep}>–</span>
                    <Input
                        type="time"
                        aria-label="Fim"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className={weekDayTimeInput}
                    />
                    <Input
                        type="number"
                        min={5}
                        max={120}
                        aria-label="Duração do atendimento (minutos)"
                        value={slotDuration}
                        onChange={(e) => setSlotDuration(Number(e.target.value))}
                        className={weekDaySlotInput}
                    />
                    <span className={sectionSub}>min</span>
                </>
            )}
            <Button
                variant="outline"
                size="sm"
                className={weekDaySaveBtn}
                disabled={!dirty || saving}
                onClick={() => onSave({active, startTime, endTime, slotDuration})}
            >
                Salvar
            </Button>
        </div>
    );
}
