import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Phone,
  MapPin,
  Activity,
  ChevronRight,
  ChevronLeft,
  Lock,
  Info,
  Check,
  Mail,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  useGetPatient,
  useUpdatePatient,
  type UpdatePatientInputDto,
  type Patient,
  UpdatePatientInputDtoGender,
} from "@agenda-app/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/patients/$patientId/edit")({
  component: EditPatientPage,
});

// ── Constants ─────────────────────────────────────────────────────────────────

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

const TABS = [
  { key: "identity", num: "1", label: "Identificação", icon: User },
  { key: "contact",  num: "2", label: "Contato",       icon: Phone },
  { key: "address",  num: "3", label: "Endereço",      icon: MapPin },
  { key: "health",   num: "4", label: "Saúde",         icon: Activity },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  // Tab 1 — Identificação (no documentId — cannot be changed after creation)
  name:      z.string().min(1, "Nome é obrigatório"),
  birthDate: z.string().optional().nullable(),
  gender:    z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),

  // Tab 2 — Contato
  phone:                 z.string().optional().nullable(),
  email:                 z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  emergencyContactName:  z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),

  // Tab 3 — Endereço
  zipCode:      z.string().optional().nullable(),
  street:       z.string().optional().nullable(),
  number:       z.string().optional().nullable(),
  complement:   z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city:         z.string().optional().nullable(),
  state:        z.string().optional().nullable(),

  // Tab 4 — Saúde (UI-only; stored in clinical profile, not in UpdatePatientInputDto)
  allergies: z.string().optional().nullable(),
  notes:     z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function asStr(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/** Safely extract a string from Orval-generated nullable-object types like PatientInsurancePlanId. */
function toNullableStr(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function tabHasValues(tab: TabKey, values: Partial<FormValues>): boolean {
  switch (tab) {
    case "identity":
      return !!(values.name || values.birthDate || values.gender);
    case "contact":
      return !!(values.phone || values.email || values.emergencyContactName || values.emergencyContactPhone);
    case "address":
      return !!(values.zipCode || values.street || values.city || values.state);
    case "health":
      return !!(values.allergies || values.notes);
    default:
      return false;
  }
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  optional,
  hint,
  error,
  cols = 12,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(S.field.root, S.span({ cols }))}>
      <div className={S.field.label}>
        {label}
        {required && <span className={S.field.req}>*</span>}
        {optional && <span className={S.field.opt}>(opcional)</span>}
      </div>
      {children}
      {error && (
        <span className={S.field.error}>
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </span>
      )}
      {!error && hint && <span className={S.field.hint}>{hint}</span>}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHead({ num, title, subtitle }: { num: string; title: string; subtitle?: string }) {
  return (
    <div className={S.section.head}>
      <div className="flex items-start gap-3">
        <span className={S.section.num}>{num}</span>
        <div>
          <h2 className={S.section.title}>{title}</h2>
          {subtitle && <p className={S.section.sub}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Route component ───────────────────────────────────────────────────────────

export function EditPatientPage() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const { data: patient, isLoading, isError } = useGetPatient(patientId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] rounded-(--radius-card)" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-(--color-text-secondary)">
        <p className="text-sm">Paciente não encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/patients" })}>
          Voltar
        </Button>
      </div>
    );
  }

  return <EditPatientForm patient={patient} />;
}

// ── Form ──────────────────────────────────────────────────────────────────────

function EditPatientForm({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("identity");
  const [zipLoading, setZipLoading] = useState(false);

  const addr = patient.address;

  const updatePatient = useUpdatePatient({
    mutation: {
      onSuccess: async () => {
        toast.success("Cadastro atualizado com sucesso");
        await navigate({
          to: "/patients/$patientId",
          params: { patientId: patient.id },
        });
      },
      onError: () => {
        toast.error("Erro ao salvar alterações. Verifique os dados e tente novamente.");
      },
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:      asStr(patient.name) ?? "",
      birthDate: asStr(patient.birthDate),
      gender:    (patient.gender as "MALE" | "FEMALE" | "OTHER" | null) ?? null,
      phone:     asStr(patient.phone),
      email:     asStr(patient.email),
      emergencyContactName:  asStr(patient.emergencyContactName),
      emergencyContactPhone: asStr(patient.emergencyContactPhone),
      zipCode:      addr ? asStr(addr.zipCode) : null,
      street:       addr ? asStr(addr.street)  : null,
      number:       addr ? asStr(addr.number)  : null,
      complement:   addr ? asStr(addr.complement)   : null,
      neighborhood: addr ? asStr(addr.neighborhood) : null,
      city:         addr ? asStr(addr.city)  : null,
      state:        addr ? asStr(addr.state) : null,
      allergies: null,
      notes:     null,
    },
  });

  const values = watch();
  const tabIdx  = TABS.findIndex((t) => t.key === tab);
  const isFirst = tabIdx === 0;
  const isLast  = tabIdx === TABS.length - 1;

  function goPrev() { if (!isFirst) setTab(TABS[tabIdx - 1].key); }
  function goNext()  { if (!isLast)  setTab(TABS[tabIdx + 1].key); }

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const hasAddress = data.street || data.city || data.zipCode;

    const dto: UpdatePatientInputDto = {
      name:                  data.name,
      birthDate:             data.birthDate             || null,
      gender:                (data.gender as UpdatePatientInputDto["gender"]) ?? null,
      phone:                 data.phone                 || null,
      email:                 data.email                 || null,
      emergencyContactName:  data.emergencyContactName  || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      address: hasAddress
        ? {
            street:       data.street       || null,
            number:       data.number       || null,
            complement:   data.complement   || null,
            neighborhood: data.neighborhood || null,
            city:         data.city         || null,
            state:        data.state        || null,
            zipCode:      data.zipCode      || null,
            country:      "BR",
          }
        : null,
      // Preserve existing insurance data (PatientInsurance* types are nullable-object in Orval)
      insurancePlanId:      toNullableStr(patient.insurancePlanId),
      insuranceCardNumber:  toNullableStr(patient.insuranceCardNumber),
      insuranceValidUntil:  toNullableStr(patient.insuranceValidUntil),
    };

    updatePatient.mutate({ id: patient.id, data: dto });
  };

  // Simulate zip code auto-fill
  const zipValue = watch("zipCode") ?? "";

  useEffect(() => {
    const digits = zipValue.replace(/\D/g, "");

    if (digits.length === 8) {
      setZipLoading(true);
      const timer = setTimeout(() => setZipLoading(false), 900);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [zipValue]);

  function goBack() {
    navigate({ to: "/patients/$patientId", params: { patientId: patient.id } });
  }

  return (
    <div className={S.page.root}>
      {/* Breadcrumb */}
      <div className={S.breadcrumb.root}>
        <button
          type="button"
          className={S.breadcrumb.link}
          onClick={() => navigate({ to: "/patients" })}
        >
          Pacientes
        </button>
        <ChevronRight className="size-3" strokeWidth={1.5} />
        <button type="button" className={S.breadcrumb.link} onClick={goBack}>
          {patient.name}
        </button>
        <ChevronRight className="size-3" strokeWidth={1.5} />
        <span className={S.breadcrumb.current}>Editar</span>
      </div>

      {/* Header */}
      <div className={S.pageHeader.root}>
        <div>
          <h1 className={S.pageHeader.title}>Editar paciente</h1>
          <p className={S.pageHeader.sub}>
            Atualize os dados administrativos e iniciais do paciente.
          </p>
        </div>
      </div>

      {/* Form card */}
      <form id="edit-patient-form" onSubmit={handleSubmit(onSubmit)}>
        <div className={S.formCard}>
          {/* Tabs */}
          <div className={S.tabs.root} role="tablist">
            {TABS.map((t) => {
              const active  = t.key === tab;
              const filled  = !active && tabHasValues(t.key, values);
              const TabIcon = t.icon;

              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={cn(S.tabs.tab, active && S.tabs.tabActive)}
                  onClick={() => setTab(t.key)}
                >
                  <span
                    className={cn(
                      S.tabs.num,
                      active && S.tabs.numActive,
                      filled && S.tabs.numFilled,
                    )}
                  >
                    {filled ? (
                      <Check className="size-[11px]" strokeWidth={2.5} />
                    ) : (
                      t.num
                    )}
                  </span>
                  <TabIcon className="hidden size-[14px] sm:block" strokeWidth={1.5} />
                  <span className={S.tabs.label}>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Tab 1: Identificação ──────────────────────────── */}
          {tab === "identity" && (
            <div className={S.section.root}>
              <SectionHead
                num="1"
                title="Identificação pessoal"
                subtitle="Dados básicos do paciente."
              />

              {/* Document ID — read-only after creation */}
              <div className={cn(S.field.root, S.span({ cols: 12 }), "mb-4")}>
                <div className={S.field.label}>Documento (CPF / RG / Prontuário)</div>
                <div
                  className={cn(
                    S.field.inputBase,
                    S.field.inputMono,
                    "cursor-not-allowed bg-(--color-bg-surface) text-(--color-text-secondary)",
                  )}
                >
                  {patient.documentId}
                </div>
                <span className={S.field.hint}>
                  O documento não pode ser alterado após o cadastro.
                </span>
              </div>

              <div className={S.grid}>
                <Field label="Nome completo" required cols={8} error={errors.name?.message}>
                  <input
                    {...register("name")}
                    placeholder="Ex.: Maria Helena Souza"
                    className={cn(S.field.inputBase, errors.name && S.field.inputError)}
                  />
                </Field>

                <Field label="Data de nascimento" optional cols={4}>
                  <div className={S.field.inputWithIcon}>
                    <Calendar
                      className="absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-(--color-text-tertiary)"
                      strokeWidth={1.5}
                    />
                    <input
                      {...register("birthDate")}
                      type="date"
                      className={cn(S.field.inputBase, S.field.inputMono, S.field.inputPaddedLeft)}
                    />
                  </div>
                </Field>

                <Field label="Sexo biológico" optional cols={4}>
                  <select {...register("gender")} className={cn(S.field.inputBase, S.field.selectIcon)}>
                    <option value="">Selecione…</option>
                    <option value={UpdatePatientInputDtoGender.MALE}>Masculino</option>
                    <option value={UpdatePatientInputDtoGender.FEMALE}>Feminino</option>
                    <option value={UpdatePatientInputDtoGender.OTHER}>Outro / Prefiro não informar</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* ── Tab 2: Contato ─────────────────────────────────── */}
          {tab === "contact" && (
            <div className={S.section.root}>
              <SectionHead
                num="2"
                title="Contato"
                subtitle="Canais para confirmar consultas e enviar lembretes."
              />

              <div className={S.grid}>
                <Field label="Celular / WhatsApp" optional cols={4}>
                  <div className={S.field.inputWithIcon}>
                    <Phone
                      className="absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-(--color-text-tertiary)"
                      strokeWidth={1.5}
                    />
                    <input
                      {...register("phone")}
                      placeholder="(00) 00000-0000"
                      className={cn(S.field.inputBase, S.field.inputMono, S.field.inputPaddedLeft)}
                    />
                  </div>
                </Field>

                <Field label="E-mail" optional cols={4} error={errors.email?.message}>
                  <div className={S.field.inputWithIcon}>
                    <Mail
                      className="absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-(--color-text-tertiary)"
                      strokeWidth={1.5}
                    />
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="paciente@email.com"
                      className={cn(
                        S.field.inputBase,
                        S.field.inputPaddedLeft,
                        errors.email && S.field.inputError,
                      )}
                    />
                  </div>
                </Field>
              </div>

              {/* Responsável */}
              <div className={S.subSection.root}>
                <div className={S.subSection.head}>
                  <User className="size-3.5 text-(--color-text-secondary)" strokeWidth={1.5} />
                  <h3 className={S.subSection.title}>Responsável</h3>
                  <span className={S.subSection.tag}>Opcional</span>
                  <span className={cn(S.subSection.hint, "ml-1")}>
                    · para menores ou pacientes com tutela
                  </span>
                </div>
                <div className={S.grid}>
                  <Field label="Nome do responsável" optional cols={5}>
                    <input
                      {...register("emergencyContactName")}
                      placeholder="Nome completo"
                      className={S.field.inputBase}
                    />
                  </Field>

                  <Field label="Telefone" optional cols={4}>
                    <input
                      {...register("emergencyContactPhone")}
                      placeholder="(00) 00000-0000"
                      className={cn(S.field.inputBase, S.field.inputMono)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: Endereço ───────────────────────────────── */}
          {tab === "address" && (
            <div className={S.section.root}>
              <SectionHead num="3" title="Endereço" subtitle="Todos os campos são opcionais." />

              <div className={S.grid}>
                <Field
                  label="CEP"
                  optional
                  cols={3}
                  hint={
                    zipLoading
                      ? "Buscando endereço…"
                      : "Preenche os demais campos automaticamente."
                  }
                >
                  <div className={S.field.inputWithIcon}>
                    <input
                      {...register("zipCode")}
                      placeholder="00000-000"
                      className={cn(S.field.inputBase, S.field.inputMono)}
                    />
                    {zipLoading && (
                      <span className={cn(S.field.trailIcon, "animate-spin")}>
                        <svg
                          className="size-[14px]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      </span>
                    )}
                  </div>
                </Field>

                <Field label="Logradouro" optional cols={6}>
                  <input
                    {...register("street")}
                    placeholder="Rua, avenida, travessa…"
                    className={S.field.inputBase}
                    disabled={zipLoading}
                  />
                </Field>

                <Field label="Número" optional cols={3}>
                  <input
                    {...register("number")}
                    placeholder="123"
                    className={cn(S.field.inputBase, S.field.inputMono)}
                  />
                </Field>

                <Field label="Complemento" optional cols={4}>
                  <input
                    {...register("complement")}
                    placeholder="Apto, sala, bloco…"
                    className={S.field.inputBase}
                  />
                </Field>

                <Field label="Bairro" optional cols={4}>
                  <input
                    {...register("neighborhood")}
                    placeholder="Bairro"
                    className={S.field.inputBase}
                    disabled={zipLoading}
                  />
                </Field>

                <Field label="Cidade" optional cols={3}>
                  <input
                    {...register("city")}
                    placeholder="Cidade"
                    className={S.field.inputBase}
                    disabled={zipLoading}
                  />
                </Field>

                <Field label="UF" optional cols={1}>
                  <select
                    {...register("state")}
                    className={cn(S.field.inputBase, S.field.selectIcon)}
                    disabled={zipLoading}
                  >
                    <option value="">—</option>
                    {BR_STATES.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* ── Tab 4: Saúde ──────────────────────────────────── */}
          {tab === "health" && (
            <div className={S.section.root}>
              <SectionHead
                num="4"
                title="Informações de saúde"
                subtitle="Registro inicial — a anamnese completa é feita após o cadastro."
              />

              <div className={S.grid}>
                <Field
                  label="Alergias conhecidas"
                  optional
                  cols={12}
                  hint="Liste medicamentos, alimentos ou substâncias com reações documentadas."
                >
                  <textarea
                    {...register("allergies")}
                    className={cn(S.field.inputBase, S.field.textarea)}
                    placeholder="Ex.: Dipirona — reação cutânea moderada. Frutos do mar — anafilaxia."
                  />
                </Field>

                <Field label="Observações iniciais" optional cols={12}>
                  <textarea
                    {...register("notes")}
                    className={cn(S.field.inputBase, S.field.textarea)}
                    placeholder="Histórico relevante, comorbidades conhecidas, medicação contínua, queixa que motivou o cadastro…"
                  />
                </Field>
              </div>

              <div className={S.infoNote}>
                <Info className="mt-px size-[14px] shrink-0" strokeWidth={1.5} />
                <div>
                  Esses dados são apenas um registro inicial. A{" "}
                  <strong>anamnese completa</strong>, prescrições e evoluções (SOAP) são
                  registradas no prontuário após o cadastro.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className={S.footer.root}>
          <div className={S.footer.meta}>
            <Lock className="size-3" strokeWidth={1.5} />
            <span>Dados criptografados em repouso · LGPD</span>
            <span className={S.footer.step}>
              Etapa {tabIdx + 1} de {TABS.length}
            </span>
          </div>

          <div className={S.footer.actions}>
            <Button type="button" variant="outline" size="sm" onClick={goBack}>
              Cancelar
            </Button>

            {!isFirst && (
              <Button type="button" variant="outline" size="sm" onClick={goPrev}>
                <ChevronLeft className="size-4" strokeWidth={1.5} />
                Voltar
              </Button>
            )}

            {!isLast ? (
              <Button type="button" size="sm" onClick={goNext}>
                Avançar
                <ChevronRight className="size-4" strokeWidth={1.5} />
              </Button>
            ) : (
              <Button
                type="submit"
                form="edit-patient-form"
                size="sm"
                disabled={updatePatient.isPending}
              >
                {updatePatient.isPending ? (
                  <>
                    <svg
                      className="size-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Salvando…
                  </>
                ) : (
                  <>
                    <Check className="size-4" strokeWidth={1.5} />
                    Salvar alterações
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
