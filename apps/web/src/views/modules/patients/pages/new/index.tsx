import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload,
  User,
  Phone,
  MapPin,
  Activity,
  ChevronRight,
  ChevronLeft,
  Lock,
  Info,
  Check,
  Camera,
  Mail,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  useCreatePatient,
  type CreatePatientDto,
  CreatePatientDtoGender,
} from "@agenda-app/client";
import { Button } from "@/components/ui/componentes/button";
import { SectionCard as UISectionCard, SectionCardHeader, SectionCardTitle, SectionCardBody } from "@/components/ui/componentes/card";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/componentes/breadcrumb";
import { PageHeader } from "@/components/ui/componentes/page-header";
import { Input } from "@/components/ui/componentes/input";
import { Textarea } from "@/components/ui/componentes/textarea";
import { NativeSelect } from "@/components/ui/componentes/native-select";
import { Field, FormGrid } from "@/components/ui/componentes/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/componentes/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/patients/new")({
  component: NewPatientPage,
});

// ── Constants ────────────────────────────────────────────────────────────────

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

const TABS = [
  { key: "identity", num: "1", label: "Identificação", icon: User },
  { key: "contact",  num: "2", label: "Contato",       icon: Phone },
  { key: "address",  num: "3", label: "Endereço",      icon: MapPin },
  { key: "health",   num: "4", label: "Saúde",         icon: Activity },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  // Tab 1 — Identificação
  name:       z.string().min(1, "Nome é obrigatório"),
  documentId: z.string().min(1, "Documento é obrigatório"),
  birthDate:  z.string().optional().nullable(),
  gender:     z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),

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

  // Tab 4 — Saúde (UI only — API doesn't have these fields yet)
  allergies: z.string().optional().nullable(),
  notes:     z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function tabHasValues(tab: TabKey, values: Partial<FormValues>): boolean {
  switch (tab) {
    case "identity":
      return !!(values.name || values.documentId || values.birthDate || values.gender);
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

// ── Section header ───────────────────────────────────────────────────────────

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

// ── Main page ────────────────────────────────────────────────────────────────

export function NewPatientPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("identity");
  const [zipLoading, setZipLoading] = useState(false);

  const createPatient = useCreatePatient({
    mutation: {
      onSuccess: async () => {
        toast.success("Paciente cadastrado com sucesso");
        await navigate({ to: "/patients" });
      },
      onError: () => {
        toast.error("Erro ao cadastrar paciente. Verifique os dados e tente novamente.");
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
      name: "", documentId: "", birthDate: null, gender: null,
      phone: null, email: null, emergencyContactName: null, emergencyContactPhone: null,
      zipCode: null, street: null, number: null, complement: null,
      neighborhood: null, city: null, state: null,
      allergies: null, notes: null,
    },
  });

  const values = watch();

  const tabIdx  = TABS.findIndex((t) => t.key === tab);
  const isFirst = tabIdx === 0;
  const isLast  = tabIdx === TABS.length - 1;

  function goPrev() {
    if (!isFirst) setTab(TABS[tabIdx - 1].key);
  }

  function goNext() {
    if (!isLast) setTab(TABS[tabIdx + 1].key);
  }

  // Re-render lucide icons when tab changes
  useEffect(() => {
    if (typeof window !== "undefined" && (window as { lucide?: { createIcons: () => void } }).lucide) {
      (window as { lucide?: { createIcons: () => void } }).lucide?.createIcons();
    }
  }, [tab]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const hasAddress = data.street || data.city || data.zipCode;

    const dto: CreatePatientDto = {
      name:       data.name,
      documentId: data.documentId,
      birthDate:  data.birthDate || null,
      gender:     (data.gender as CreatePatientDto["gender"]) ?? null,
      phone:      data.phone || null,
      email:      data.email || null,
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
    };

    createPatient.mutate({ data: dto });
  };

  // Simulate zip code auto-fill (UI-only demo)
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

  return (
    <div className={S.page.root}>
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button" onClick={() => navigate({ to: "/patients" })}>Pacientes</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Novo paciente</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <PageHeader
        title="Novo paciente"
        subtitle="Cadastro inicial — anamnese clínica é registrada nas evoluções."
        actions={
          <Button variant="outline" size="sm" type="button">
            <Upload className="size-4" strokeWidth={1.5} />
            Importar de documento
          </Button>
        }
      />

      {/* AI nudge */}
      <div className={S.aiNudge.root}>
        <span className={S.aiNudge.icon}>
          <Sparkles className="size-3.5" strokeWidth={1.5} />
        </span>
        <div className={S.aiNudge.body}>
          <div className={S.aiNudge.title}>
            <span className={S.aiNudge.badge}>IA</span>
            Acelerar cadastro
          </div>
          <p className={S.aiNudge.sub}>
            Envie um documento (RG, CNH ou ficha) e a IA pré-preenche identificação e endereço · você revisa antes de salvar.
          </p>
        </div>
        <button type="button" className={S.aiNudge.btn}>
          <Upload className="size-3" strokeWidth={1.5} />
          Anexar documento
        </button>
      </div>

      {/* Form card */}
      <form id="patient-form" onSubmit={handleSubmit(onSubmit)}>
        <UISectionCard>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="flex flex-col">
            <TabsList>
              {TABS.map((t) => {
                const filled = tab !== t.key && tabHasValues(t.key, values);
                const TabIcon = t.icon;

                return (
                  <TabsTrigger key={t.key} value={t.key}>
                    <span className={cn(S.tabNum, tab === t.key && S.tabNumActive, filled && S.tabNumFilled)}>
                      {filled ? (
                        <Check className="size-[11px]" strokeWidth={2.5} />
                      ) : (
                        t.num
                      )}
                    </span>
                    <TabIcon className="hidden size-[14px] sm:block" strokeWidth={1.5} />
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* ── Tab 1: Identificação ─────────────────────────────── */}
            <TabsContent value="identity">
            <div className={S.section.root}>
              <SectionHead
                num="1"
                title="Identificação pessoal"
                subtitle="Dados básicos para criar o registro do paciente."
              />

              {/* Photo uploader (UI only) */}
              <div className={S.photo.root}>
                <div className={cn(S.photo.frame, "group")}>
                  <Camera className="size-[22px]" strokeWidth={1.5} />
                  <span className={S.photo.text}>Clique para adicionar foto</span>
                </div>
                <div className={S.photo.meta}>
                  <span className={S.photo.title}>Foto do paciente</span>
                  <span className={S.photo.sub}>JPG ou PNG · até 5 MB · proporção 1:1 recomendada</span>
                  <span className={cn(S.photo.sub, "mt-1 text-(--color-text-tertiary)")}>
                    Opcional · ajuda na identificação visual
                  </span>
                </div>
              </div>

              <FormGrid>
                <Field label="Nome completo" required cols={8} error={errors.name?.message}>
                  <Input
                    {...register("name")}
                    placeholder="Ex.: Maria Helena Souza"
                    state={errors.name ? 'error' : 'default'}
                  />
                </Field>

                <Field label="Documento (CPF / RG / Prontuário)" required cols={4} error={errors.documentId?.message}>
                  <Input
                    {...register("documentId")}
                    placeholder="000.000.000-00"
                    appearance="mono"
                    state={errors.documentId ? 'error' : 'default'}
                  />
                </Field>

                <Field label="Data de nascimento" optional cols={4}>
                  <Input
                    {...register("birthDate")}
                    type="date"
                    appearance="mono"
                    leadIcon={<Calendar className="size-[14px]" strokeWidth={1.5} />}
                  />
                </Field>

                <Field label="Sexo biológico" optional cols={4}>
                  <NativeSelect {...register("gender")}>
                    <option value="">Selecione…</option>
                    <option value={CreatePatientDtoGender.MALE}>Masculino</option>
                    <option value={CreatePatientDtoGender.FEMALE}>Feminino</option>
                    <option value={CreatePatientDtoGender.OTHER}>Outro / Prefiro não informar</option>
                  </NativeSelect>
                </Field>

                <Field
                  label="Nome social"
                  optional
                  cols={4}
                  hint="Como o paciente prefere ser chamado."
                >
                  <Input placeholder="Ex.: Helena" disabled title="Disponível em breve" />
                </Field>
              </FormGrid>
            </div>
          </TabsContent>

            {/* ── Tab 2: Contato ────────────────────────────────────── */}
            <TabsContent value="contact">
            <div className={S.section.root}>
              <SectionHead
                num="2"
                title="Contato"
                subtitle="Canais para confirmar consultas e enviar lembretes."
              />

              <FormGrid>
                <Field label="Celular / WhatsApp" required cols={4}>
                  <Input
                    {...register("phone")}
                    placeholder="(00) 00000-0000"
                    appearance="mono"
                    leadIcon={<Phone className="size-[14px]" strokeWidth={1.5} />}
                  />
                </Field>

                <Field label="E-mail" optional cols={4} error={errors.email?.message}>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="paciente@email.com"
                    leadIcon={<Mail className="size-[14px]" strokeWidth={1.5} />}
                    state={errors.email ? 'error' : 'default'}
                  />
                </Field>
              </FormGrid>

              {/* Responsável */}
              <div className={S.subSection.root}>
                <div className={S.subSection.head}>
                  <User className="size-3.5 text-(--color-text-secondary)" strokeWidth={1.5} />
                  <h3 className={S.subSection.title}>Responsável</h3>
                  <span className={S.subSection.tag}>Opcional</span>
                  <span className={cn(S.subSection.hint, "ml-1")}>· para menores ou pacientes com tutela</span>
                </div>
                <FormGrid>
                  <Field label="Nome do responsável" optional cols={5}>
                    <Input
                      {...register("emergencyContactName")}
                      placeholder="Nome completo"
                    />
                  </Field>

                  <Field label="Telefone" optional cols={4}>
                    <Input
                      {...register("emergencyContactPhone")}
                      placeholder="(00) 00000-0000"
                      appearance="mono"
                    />
                  </Field>

                  <Field label="Relação com o paciente" optional cols={3}>
                    <NativeSelect disabled>
                      <option value="">Selecione…</option>
                      <option>Mãe / Pai</option>
                      <option>Cônjuge</option>
                      <option>Filho(a)</option>
                      <option>Responsável legal</option>
                    </NativeSelect>
                  </Field>
                </FormGrid>
              </div>
            </div>
          </TabsContent>

            {/* ── Tab 3: Endereço ───────────────────────────────────── */}
            <TabsContent value="address">
            <div className={S.section.root}>
              <SectionHead
                num="3"
                title="Endereço"
                subtitle="Todos os campos são opcionais."
              />

              <FormGrid>
                <Field
                  label="CEP"
                  optional
                  cols={3}
                  hint={zipLoading ? "Buscando endereço…" : "Preenche os demais campos automaticamente."}
                >
                  <Input
                    {...register("zipCode")}
                    placeholder="00000-000"
                    appearance="mono"
                    trailIcon={
                      zipLoading ? (
                        <svg className="size-[14px] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : undefined
                    }
                  />
                </Field>

                <Field label="Logradouro" optional cols={6}>
                  <Input
                    {...register("street")}
                    placeholder="Rua, avenida, travessa…"
                    disabled={zipLoading}
                  />
                </Field>

                <Field label="Número" optional cols={3}>
                  <Input
                    {...register("number")}
                    placeholder="123"
                    appearance="mono"
                  />
                </Field>

                <Field label="Complemento" optional cols={4}>
                  <Input {...register("complement")} placeholder="Apto, sala, bloco…" />
                </Field>

                <Field label="Bairro" optional cols={4}>
                  <Input
                    {...register("neighborhood")}
                    placeholder="Bairro"
                    disabled={zipLoading}
                  />
                </Field>

                <Field label="Cidade" optional cols={3}>
                  <Input
                    {...register("city")}
                    placeholder="Cidade"
                    disabled={zipLoading}
                  />
                </Field>

                <Field label="UF" optional cols={1}>
                  <NativeSelect {...register("state")} disabled={zipLoading}>
                    <option value="">—</option>
                    {BR_STATES.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </FormGrid>
            </div>
          </TabsContent>

            {/* ── Tab 4: Saúde ─────────────────────────────────────── */}
            <TabsContent value="health">
            <div className={S.section.root}>
              <SectionHead
                num="4"
                title="Informações de saúde"
                subtitle="Registro inicial — a anamnese completa é feita após o cadastro."
              />

              <FormGrid>
                <Field label="Tipo sanguíneo" optional cols={3}>
                  <NativeSelect disabled>
                    <option value="">Não informado</option>
                    <option>A</option>
                    <option>B</option>
                    <option>AB</option>
                    <option>O</option>
                  </NativeSelect>
                </Field>

                <Field label="Fator Rh" optional cols={3}>
                  <NativeSelect disabled>
                    <option value="">Não informado</option>
                    <option>Positivo (+)</option>
                    <option>Negativo (−)</option>
                  </NativeSelect>
                </Field>

                <Field
                  label="Alergias conhecidas"
                  optional
                  cols={12}
                  hint="Liste medicamentos, alimentos ou substâncias com reações documentadas."
                >
                  <Textarea
                    {...register("allergies")}
                    placeholder="Ex.: Dipirona — reação cutânea moderada. Frutos do mar — anafilaxia."
                  />
                </Field>

                <Field label="Observações iniciais" optional cols={12}>
                  <Textarea
                    {...register("notes")}
                    placeholder="Histórico relevante, comorbidades conhecidas, medicação contínua, queixa que motivou o cadastro…"
                  />
                </Field>
              </FormGrid>

              <div className={S.infoNote}>
                <Info className="mt-px size-[14px] shrink-0" strokeWidth={1.5} />
                <div>
                  Esses dados são apenas um registro inicial. A <strong>anamnese completa</strong>,
                  prescrições e evoluções (SOAP) são registradas no prontuário após o cadastro.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/patients" })}
            >
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
                form="patient-form"
                size="sm"
                disabled={createPatient.isPending}
              >
                {createPatient.isPending ? (
                  <>
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Salvando…
                  </>
                ) : (
                  <>
                    <User className="size-4" strokeWidth={1.5} />
                    Salvar paciente
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        </UISectionCard>
      </form>
    </div>
  );
}
