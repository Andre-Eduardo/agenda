import {useEffect, useRef, useState} from 'react';
import {
    AxiosError,
    getGetReminderConfigQueryKey,
    useGetCurrentClinicMember,
    useGetReminderConfig,
    useGetWhatsAppConfig,
    usePreviewReminderMessage,
    useUpsertReminderConfig,
    type ApiProblem,
    type ClinicReminderConfig,
} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {Info, Plus, RotateCcw, Trash2} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {SegmentedControl, SegmentedControlItem} from '@/components/ui/componentes/segmented-control';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Textarea} from '@/components/ui/componentes/textarea';
import {useCan} from '@/hooks/useCan';
import {translateApiError} from '@/utils/translate-api-error';
import {
    FooterBar,
    FormCard,
    FormSection,
    PageHeading,
    SkeletonTabContent,
    emptyRowText,
    fieldError,
    fieldHint,
    sectionSub,
    sectionTitle,
    skeletonH10,
    skeletonH4W48,
} from '@/views/modules/settings/pages/index/styles';
import {
    channelList,
    channelOption,
    leadTimeHint,
    leadTimeInput,
    leadTimeList,
    leadTimeRow,
    previewBox,
    previewLabel,
    previewText,
    sectionDivider,
    templateMeta,
    variableList,
    warningText,
} from './styles';
import {
    REMINDER_LIMITS,
    REMINDER_VARIABLES,
    describeLeadTime,
    insertVariable,
    parseLeadTimes,
    templateProblem,
    validateReminderForm,
    type ReminderChannelOption,
    type ReminderForm,
} from './utils';

const PREVIEW_DEBOUNCE = 400;

const CHANNELS: Array<{value: ReminderChannelOption; label: string}> = [
    {value: 'WHATSAPP', label: 'WhatsApp'},
    {value: 'EMAIL', label: 'E-mail'},
];

function apiErrorDetail(error: unknown): string | null {
    return error instanceof AxiosError ? ((error.response?.data as ApiProblem | undefined)?.detail ?? null) : null;
}

function isChannelOption(value: string): value is ReminderChannelOption {
    return value === 'WHATSAPP' || value === 'EMAIL';
}

function formFromConfig(config: ClinicReminderConfig): ReminderForm {
    return {
        isActive: config.isActive,
        channels: config.enabledChannels.filter(isChannelOption),
        leadTimes: config.hoursBeforeList.map(String),
        messageTemplate: config.messageTemplate,
    };
}

/**
 * Reminder settings of the clinic (L2-03): on/off, channels, lead times and text, with a live preview.
 * Channels, lead times and on/off apply to appointments created after saving; the text applies to the
 * next reminders sent.
 */
export function RemindersSection() {
    const queryClient = useQueryClient();
    const canManage = useCan({has: 'clinic-reminder-config:manage'});
    const canViewWhatsApp = useCan({has: 'whatsapp:view'});

    const memberQuery = useGetCurrentClinicMember();
    const clinicId = memberQuery.data?.clinicId ?? '';
    const configQuery = useGetReminderConfig(clinicId, {query: {enabled: clinicId !== ''}});
    const whatsAppQuery = useGetWhatsAppConfig({query: {enabled: canViewWhatsApp}});

    const [form, setForm] = useState<ReminderForm | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const templateRef = useRef<HTMLTextAreaElement>(null);

    const config = configQuery.data;

    useEffect(() => {
        if (config !== undefined && form === null) setForm(formFromConfig(config));
    }, [config, form]);

    const preview = usePreviewReminderMessage();
    const previewMutate = preview.mutate;
    const template = form?.messageTemplate;

    useEffect(() => {
        // Only well-formed texts go to the server, so typing an unknown variable never raises an API error.
        if (template === undefined || clinicId === '' || templateProblem(template) !== null) return undefined;

        const timer = setTimeout(() => previewMutate({clinicId, data: {messageTemplate: template}}), PREVIEW_DEBOUNCE);

        return () => clearTimeout(timer);
    }, [template, clinicId, previewMutate]);

    const upsert = useUpsertReminderConfig({
        mutation: {
            onSuccess: (saved) => {
                queryClient.setQueryData(getGetReminderConfigQueryKey(clinicId), saved);
                setForm(formFromConfig(saved));
                setSubmitted(false);
                toast.success('Lembretes salvos. As mudanças valem para os próximos agendamentos.');
            },
            onError: (error) =>
                toast.error(translateApiError(apiErrorDetail(error), 'Não foi possível salvar os lembretes.')),
        },
    });

    const isLoading = memberQuery.isLoading || configQuery.isLoading || (config !== undefined && form === null);

    if (configQuery.isError) {
        return (
            <div>
                <Heading />
                <FormCard>
                    <FormSection>
                        <p className={emptyRowText}>Não foi possível carregar os lembretes. Tente novamente.</p>
                    </FormSection>
                </FormCard>
            </div>
        );
    }

    if (isLoading || form === null || config === undefined) {
        return (
            <div>
                <Heading />
                <FormCard>
                    <SkeletonTabContent>
                        <Skeleton className={skeletonH4W48} />
                        <Skeleton className={skeletonH10} />
                        <Skeleton className={skeletonH10} />
                    </SkeletonTabContent>
                </FormCard>
            </div>
        );
    }

    const errors = submitted ? validateReminderForm(form) : {};
    const disabled = !canManage || upsert.isPending;
    const whatsAppConnected = whatsAppQuery.data?.[0]?.status === 'open';
    const showWhatsAppWarning =
        canViewWhatsApp && whatsAppQuery.isSuccess && form.channels.includes('WHATSAPP') && !whatsAppConnected;
    const parsedLeadTimes = parseLeadTimes(form.leadTimes) ?? [];
    const usingDefaultText = form.messageTemplate.trim() === config.defaultMessageTemplate;

    function update(patch: Partial<ReminderForm>) {
        setForm((current) => (current === null ? current : {...current, ...patch}));
    }

    function toggleChannel(channel: ReminderChannelOption, checked: boolean) {
        if (form === null) return;

        update({
            channels: checked ? [...form.channels, channel] : form.channels.filter((value) => value !== channel),
        });
    }

    function handleInsertVariable(name: string) {
        if (form === null) return;

        const textarea = templateRef.current;
        const {text, cursor} = insertVariable(
            form.messageTemplate,
            name,
            textarea?.selectionStart ?? null,
            textarea?.selectionEnd ?? null
        );

        update({messageTemplate: text});
        requestAnimationFrame(() => {
            textarea?.focus();
            textarea?.setSelectionRange(cursor, cursor);
        });
    }

    function handleSave() {
        if (form === null || config === undefined) return;

        setSubmitted(true);

        const validation = validateReminderForm(form);
        const hoursBeforeList = parseLeadTimes(form.leadTimes);

        if (Object.keys(validation).length > 0 || hoursBeforeList === null) return;

        upsert.mutate({
            clinicId,
            data: {
                enabledChannels: form.channels,
                hoursBeforeList,
                // The default text is saved as null, so the clinic keeps following it if it changes.
                messageTemplate:
                    form.messageTemplate.trim() === config.defaultMessageTemplate ? null : form.messageTemplate,
                isActive: form.isActive,
            },
        });
    }

    return (
        <div>
            <Heading />

            <FormCard>
                <FormSection>
                    <div className="sec-head">
                        <span className="sec-num">1</span>
                        <div>
                            <div className={sectionTitle}>Envio automático</div>
                            <div className={sectionSub}>
                                {config.configured
                                    ? 'Quando ativo, cada novo agendamento gera os lembretes configurados abaixo.'
                                    : 'Os lembretes ainda não foram configurados nesta clínica. Revise as opções e salve para ativar.'}
                            </div>
                        </div>
                    </div>
                    <SegmentedControl
                        aria-label="Envio automático de lembretes"
                        value={form.isActive ? 'on' : 'off'}
                        onValueChange={(value) => !disabled && update({isActive: value === 'on'})}
                    >
                        <SegmentedControlItem value="on" disabled={disabled}>
                            Ativado
                        </SegmentedControlItem>
                        <SegmentedControlItem value="off" disabled={disabled}>
                            Desativado
                        </SegmentedControlItem>
                    </SegmentedControl>
                </FormSection>

                <FormSection className={sectionDivider}>
                    <div className="sec-head">
                        <span className="sec-num">2</span>
                        <div>
                            <div className={sectionTitle}>Canais</div>
                            <div className={sectionSub}>
                                O paciente recebe um lembrete por canal escolhido. SMS ainda não está disponível.
                            </div>
                        </div>
                    </div>
                    <div className={channelList} role="group" aria-label="Canais de envio">
                        {CHANNELS.map((channel) => (
                            <label key={channel.value} className={channelOption}>
                                <input
                                    type="checkbox"
                                    aria-label={channel.label}
                                    checked={form.channels.includes(channel.value)}
                                    disabled={disabled}
                                    onChange={(event) => toggleChannel(channel.value, event.target.checked)}
                                />
                                {channel.label}
                            </label>
                        ))}
                    </div>
                    {errors.channels && <p className={fieldError}>{errors.channels}</p>}
                    {showWhatsAppWarning && (
                        <p className={warningText}>
                            Nenhum WhatsApp conectado. Conecte o número da clínica na seção WhatsApp para que os
                            lembretes sejam entregues.
                        </p>
                    )}
                </FormSection>

                <FormSection className={sectionDivider}>
                    <div className="sec-head">
                        <span className="sec-num">3</span>
                        <div>
                            <div className={sectionTitle}>Antecedência</div>
                            <div className={sectionSub}>
                                Quantas horas antes da consulta o lembrete é enviado. Até {REMINDER_LIMITS.maxLeadTimes}{' '}
                                envios, de {REMINDER_LIMITS.minHoursBefore} h a {REMINDER_LIMITS.maxHoursBefore} h (7
                                dias).
                            </div>
                        </div>
                    </div>
                    <div className={leadTimeList}>
                        {form.leadTimes.map((value, index) => {
                            const hours = Number(value);
                            const isValid = parseLeadTimes([value]) !== null;

                            return (
                                // Lead times have no identity besides their position.
                                // oxlint-disable-next-line react/no-array-index-key
                                <div key={index} className={leadTimeRow}>
                                    <Input
                                        className={leadTimeInput}
                                        type="number"
                                        inputMode="numeric"
                                        min={REMINDER_LIMITS.minHoursBefore}
                                        max={REMINDER_LIMITS.maxHoursBefore}
                                        step={1}
                                        aria-label={`Antecedência ${index + 1}, em horas`}
                                        value={value}
                                        disabled={disabled}
                                        onChange={(event) =>
                                            update({
                                                leadTimes: form.leadTimes.map((current, position) =>
                                                    position === index ? event.target.value : current
                                                ),
                                            })
                                        }
                                    />
                                    <span className={leadTimeHint}>
                                        {isValid ? describeLeadTime(hours) : 'horas antes'}
                                    </span>
                                    {form.leadTimes.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            aria-label={`Remover antecedência ${index + 1}`}
                                            disabled={disabled}
                                            onClick={() =>
                                                update({
                                                    leadTimes: form.leadTimes.filter(
                                                        (_, position) => position !== index
                                                    ),
                                                })
                                            }
                                        >
                                            <Trash2 size={13} />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                        {form.leadTimes.length < REMINDER_LIMITS.maxLeadTimes && (
                            <div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() => update({leadTimes: [...form.leadTimes, '2']})}
                                >
                                    <Plus size={13} />
                                    Adicionar antecedência
                                </Button>
                            </div>
                        )}
                    </div>
                    {errors.leadTimes && <p className={fieldError}>{errors.leadTimes}</p>}
                </FormSection>

                <FormSection className={sectionDivider}>
                    <div className="sec-head">
                        <span className="sec-num">4</span>
                        <div>
                            <div className={sectionTitle}>Texto do lembrete</div>
                            <div className={sectionSub}>
                                Use as variáveis para personalizar a mensagem. No e-mail, o assunto é “Lembrete de
                                consulta”.
                            </div>
                        </div>
                    </div>
                    <div className={variableList} role="group" aria-label="Inserir variável">
                        {REMINDER_VARIABLES.map((variable) => (
                            <Button
                                key={variable.name}
                                variant="outline"
                                size="sm"
                                disabled={disabled}
                                onClick={() => handleInsertVariable(variable.name)}
                            >
                                <Plus size={12} />
                                {variable.label}
                            </Button>
                        ))}
                    </div>
                    <Textarea
                        ref={templateRef}
                        rows={5}
                        aria-label="Texto do lembrete"
                        aria-invalid={errors.messageTemplate !== undefined}
                        maxLength={REMINDER_LIMITS.maxTemplateLength}
                        value={form.messageTemplate}
                        disabled={disabled}
                        onChange={(event) => update({messageTemplate: event.target.value})}
                    />
                    <div className={templateMeta}>
                        <span>
                            {form.messageTemplate.length}/{REMINDER_LIMITS.maxTemplateLength} caracteres
                        </span>
                        {usingDefaultText ? (
                            <span>Texto padrão</span>
                        ) : (
                            canManage && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() => update({messageTemplate: config.defaultMessageTemplate})}
                                >
                                    <RotateCcw size={13} />
                                    Usar texto padrão
                                </Button>
                            )
                        )}
                    </div>
                    {errors.messageTemplate && <p className={fieldError}>{errors.messageTemplate}</p>}

                    <div
                        className={previewBox}
                        role="region"
                        aria-label="Pré-visualização do lembrete"
                        aria-live="polite"
                    >
                        <div className={previewLabel}>Pré-visualização (dados de exemplo)</div>
                        {templateProblem(form.messageTemplate) !== null ? (
                            <p className={fieldError}>Corrija o texto para ver a pré-visualização.</p>
                        ) : preview.isError ? (
                            <p className={fieldError}>
                                {translateApiError(
                                    apiErrorDetail(preview.error),
                                    'Corrija o texto para ver a pré-visualização.'
                                )}
                            </p>
                        ) : (
                            <p className={previewText}>{preview.data?.message ?? '…'}</p>
                        )}
                    </div>
                    {parsedLeadTimes.length > 0 && (
                        <p className={fieldHint}>
                            Enviado {parsedLeadTimes.map((hours) => describeLeadTime(hours)).join(', ')} da consulta.
                        </p>
                    )}
                </FormSection>

                <FooterBar>
                    <div className="meta">
                        <Info size={11} />
                        <span>
                            Canais, antecedência e ativação valem para agendamentos criados depois de salvar. O texto
                            vale para os próximos envios.
                        </span>
                    </div>
                    <div className="actions">
                        <Button
                            variant="outline"
                            disabled={upsert.isPending}
                            onClick={() => {
                                setForm(formFromConfig(config));
                                setSubmitted(false);
                            }}
                        >
                            Descartar
                        </Button>
                        {canManage && (
                            <Button onClick={handleSave} disabled={upsert.isPending}>
                                Salvar lembretes
                            </Button>
                        )}
                    </div>
                </FooterBar>
            </FormCard>
        </div>
    );
}

function Heading() {
    return (
        <PageHeading>
            <h1 className="title">Lembretes</h1>
            <p className="sub">
                Defina como os pacientes são lembrados das consultas: canal, antecedência e texto da mensagem.
            </p>
        </PageHeading>
    );
}
