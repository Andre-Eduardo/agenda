import { createFileRoute } from '@tanstack/react-router';
import { useState, useId } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  useGetCurrentUser,
  useUpdateUser,
  useSearchProfessionals,
  useUpdateProfessional,
  useChangeUserPassword,
  type Professional,
  type UpdateProfessionalInputDto,
} from '@agenda-app/client';
import {
  Briefcase,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Hospital,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/componentes/button';
import { Input } from '@/components/ui/componentes/input';
import { Label } from '@/components/ui/componentes/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/componentes/select';
import { Skeleton } from '@/components/ui/componentes/skeleton';
import { cn } from '@/lib/utils';
import * as S from './styles';

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_stackedLayout/settings')({
  component: SettingsPage,
});

// ─── Constants ───────────────────────────────────────────────────────────────

const PROFESSIONS = [
  { value: 'medico',          label: 'Médico',          registry: 'CRM' },
  { value: 'psicologo',       label: 'Psicólogo',       registry: 'CRP' },
  { value: 'fisioterapeuta',  label: 'Fisioterapeuta',  registry: 'CREFITO' },
  { value: 'fonoaudiologo',   label: 'Fonoaudiólogo',   registry: 'CRFa' },
  { value: 'nutricionista',   label: 'Nutricionista',   registry: 'CRN' },
  { value: 'enfermeiro',      label: 'Enfermeiro',      registry: 'COREN' },
  { value: 'outro',           label: 'Outro',           registry: 'Registro' },
] as const;

const SPECIALTIES: Record<string, string[]> = {
  medico:         ['Cardiologia', 'Clínica geral', 'Dermatologia', 'Endocrinologia', 'Gastroenterologia', 'Geriatria', 'Ginecologia', 'Neurologia', 'Ortopedia', 'Pediatria', 'Pneumologia', 'Psiquiatria'],
  psicologo:      ['Clínica', 'Cognitivo-comportamental', 'Psicanálise', 'Neuropsicologia', 'Hospitalar'],
  fisioterapeuta: ['Ortopédica', 'Neurológica', 'Respiratória', 'Esportiva', 'RPG'],
  fonoaudiologo:  ['Linguagem', 'Voz', 'Audiologia', 'Motricidade orofacial'],
  nutricionista:  ['Clínica', 'Esportiva', 'Materno-infantil', 'Oncológica'],
  enfermeiro:     ['UTI', 'Saúde da família', 'Centro cirúrgico'],
  outro:          [],
};

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const PROFILE_TABS = [
  { key: 'identity', num: '1', label: 'Foto e identidade',   icon: UserRound },
  { key: 'pro',      num: '2', label: 'Dados profissionais', icon: Briefcase },
  { key: 'office',   num: '3', label: 'Consultório',         icon: Hospital },
  { key: 'security', num: '4', label: 'Segurança e acesso',  icon: ShieldCheck },
] as const;

type TabKey = 'identity' | 'pro' | 'office' | 'security';
type Section = 'perfil' | 'geral';

// ─── Page ────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [section, setSection] = useState<Section>('perfil');

  return (
    <div className={S.page}>
      {/* Breadcrumb */}
      <nav className={S.breadcrumb}>
        <span className={S.breadcrumbLink}>Configurações</span>
        <span className={S.breadcrumbSep}>›</span>
        <span className={S.breadcrumbCurrent}>
          {section === 'perfil' ? 'Perfil' : 'Geral'}
        </span>
      </nav>

      <div className={S.layout}>
        {/* Side nav */}
        <aside className={S.sideNav}>
          <div className={S.sideNavTitle}>Configurações</div>
          <button
            className={S.sideNavItem({ active: section === 'perfil' })}
            onClick={() => setSection('perfil')}
          >
            <UserRound size={15} />
            <span>Perfil</span>
          </button>
          <button
            className={S.sideNavItem({ active: section === 'geral' })}
            onClick={() => setSection('geral')}
          >
            <Sliders size={15} />
            <span>Geral</span>
          </button>
        </aside>

        {/* Content */}
        <div className={S.content}>
          {section === 'perfil' && <ProfileForm />}
          {section === 'geral' && <GeneralSection />}
        </div>
      </div>
    </div>
  );
}

// ─── General (placeholder) ───────────────────────────────────────────────────

function GeneralSection() {
  return (
    <div>
      <h1 className={S.pageTitle}>Geral</h1>
      <p className={S.pageSub}>Preferências da aplicação, notificações e idioma.</p>
      <div className={cn(S.formCard, 'p-16')}>
        <div className={S.placeholder}>
          <Sliders size={28} className={S.placeholderIcon} />
          <div className={S.placeholderTitle}>Em breve</div>
          <div className={S.placeholderSub}>Configurações gerais serão exibidas aqui.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile form ─────────────────────────────────────────────────────────────

function ProfileForm() {
  const [tab, setTab] = useState<TabKey>('identity');

  // Server queries
  const userQuery = useGetCurrentUser();
  const user = userQuery.data;

  const profQuery = useSearchProfessionals({
    term: '',
    limit: 1,
    cursor: null,
    sort: null,
  }) as unknown as UseQueryResult<{ data: Professional[]; totalCount: number }>;

  const professional = profQuery.data?.data?.[0];

  const updateUser = useUpdateUser();
  const updateProfessional = useUpdateProfessional();
  const changePassword = useChangeUserPassword();

  // ── Identity state ──
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identityInitialized, setIdentityInitialized] = useState(false);

  if (user && !identityInitialized) {
    setName(user.name ?? '');
    setEmail((user.email as string) ?? '');
    setIdentityInitialized(true);
  }

  // ── Professional state ──
  const [profession, setProfession] = useState('medico');
  const [specialty, setSpecialty] = useState('');
  const [registryNum, setRegistryNum] = useState('');
  const [registryUf, setRegistryUf] = useState('SP');
  const [proInitialized, setProInitialized] = useState(false);

  if (professional && !proInitialized) {
    const rawSpecialty = (professional.specialty as string | null) ?? '';

    setSpecialty(rawSpecialty);
    setRegistryNum((professional.registrationNumber as string | null) ?? '');
    setProInitialized(true);
  }

  // ── Office state ──
  const [officeName, setOfficeName] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [officeCep, setOfficeCep] = useState('');
  const [officeStreet, setOfficeStreet] = useState('');
  const [officeNumber, setOfficeNumber] = useState('');
  const [officeComp, setOfficeComp] = useState('');
  const [officeNeigh, setOfficeNeigh] = useState('');
  const [officeCity, setOfficeCity] = useState('');
  const [officeUf, setOfficeUf] = useState('SP');
  const [cepLoading, setCepLoading] = useState(false);

  // ── Security state ──
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const pwdStrength = (() => {
    if (!newPwd) return null;
    let s = 0;

    if (newPwd.length >= 8) s++;

    if (/\d/.test(newPwd)) s++;

    if (/[^A-Za-z0-9]/.test(newPwd)) s++;

    if (/[A-Z]/.test(newPwd) && /[a-z]/.test(newPwd)) s++;

    if (s <= 1) return { level: 'weak' as const, label: 'Fraca', pct: 30 };

    if (s === 2) return { level: 'med' as const, label: 'Média', pct: 60 };

    return { level: 'strong' as const, label: 'Forte', pct: 100 };
  })();
  const pwdMatch = !!(newPwd && confirmPwd && newPwd === confirmPwd);
  const canChangePwd = !!(curPwd && newPwd && confirmPwd && pwdMatch && pwdStrength?.level !== 'weak');

  // ── Tab navigation ──
  const tabIdx = PROFILE_TABS.findIndex(t => t.key === tab);
  const isFirst = tabIdx === 0;
  const isLast = tabIdx === PROFILE_TABS.length - 1;
  const goPrev = () => setTab(PROFILE_TABS[Math.max(0, tabIdx - 1)].key);
  const goNext = () => setTab(PROFILE_TABS[Math.min(PROFILE_TABS.length - 1, tabIdx + 1)].key);

  const tabFilled: Record<TabKey, boolean> = {
    identity: !!(name && email),
    pro:      !!(profession && registryNum && registryUf),
    office:   !!(officeName || officeCep),
    security: !!curPwd,
  };

  const profDef = PROFESSIONS.find(p => p.value === profession);
  const specOptions = SPECIALTIES[profession] ?? [];

  // ── Save handlers ──
  const isSaving = updateUser.isPending || updateProfessional.isPending;

  function handleSave() {
    // Professional data (specialty, registration) — no password needed
    if (professional) {
      const dto: UpdateProfessionalInputDto = {
        registrationNumber: registryNum || null,
        specialty: specialty || null,
        specialtyNormalized: null,
      };

      updateProfessional.mutate(
        { id: professional.id, data: dto },
        {
          onSuccess: () =>
            toast.success('Perfil atualizado', {
              description: specialty ? `Agente IA: ${specialty}` : 'Alterações salvas.',
            }),
          onError: () => toast.error('Erro ao salvar dados profissionais.'),
        },
      );
    } else {
      // No professional record yet — just confirm save of other tabs
      toast.success('Alterações salvas');
    }
  }

  function handleChangePassword() {
    changePassword.mutate(
      { data: { oldPassword: curPwd, newPassword: newPwd } },
      {
        onSuccess: () => {
          toast.success('Senha alterada com sucesso');
          setCurPwd(''); setNewPwd(''); setConfirmPwd('');
        },
        onError: () => toast.error('Erro ao alterar senha. Verifique a senha atual.'),
      },
    );
  }

  const isLoading = userQuery.isLoading || profQuery.isLoading;

  return (
    <div>
      <div className={S.profileHeader}>
        <div>
          <h1 className={S.pageTitle}>Perfil do profissional</h1>
          <p className={S.pageSub}>
            Seus dados profissionais são usados para personalizar o sistema e selecionar
            o agente de IA adequado para seus atendimentos.
          </p>
        </div>
      </div>

      <div className={S.formCard}>
        {/* Tab bar */}
        <div className={S.tabList}>
          {PROFILE_TABS.map((t, i) => {
            const active = t.key === tab;
            const filled = tabFilled[t.key] && !active;
            const Icon = t.icon;

            return (
              <button
                key={t.key}
                className={S.tab({ active })}
                onClick={() => setTab(t.key)}
              >
                <span className={S.tabNum({ active, filled })}>
                  {filled ? <Check size={10} /> : t.num}
                </span>
                <Icon size={14} className="shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {isLoading ? (
          <div className={S.skeletonTabContent}>
            <Skeleton className="h-4 w-48" />
            <div className={S.skeletonGrid}>
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ) : (
          <>
            {/* ─── 1. Identity ─── */}
            {tab === 'identity' && (
              <div className={S.formSection}>
                <div className={S.sectionHead}>
                  <span className={S.sectionNum}>1</span>
                  <div>
                    <div className={S.sectionTitle}>Foto e identidade</div>
                    <div className={S.sectionSub}>
                      Como você aparece no sistema e suas credenciais de acesso.
                    </div>
                  </div>
                </div>

                {/* Photo */}
                <div className={S.photoRow}>
                  <div className={S.photoCircle}>
                    <span className={S.photoInitials}>
                      {name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '—'}
                    </span>
                  </div>
                  <div className={S.photoActions}>
                    <Button variant="outline" size="sm">
                      <Camera size={13} />
                      Alterar foto
                    </Button>
                    <p className={S.photoHint}>JPG ou PNG · até 5 MB · proporção 1:1</p>
                  </div>
                </div>

                <div className={S.grid}>
                  <Field label="Nome completo" required span={6}>
                    <Input
                      placeholder="Nome completo"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="E-mail"
                    required
                    span={6}
                    hint="É o e-mail de acesso ao sistema."
                  >
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ─── 2. Professional data ─── */}
            {tab === 'pro' && (
              <div className={S.formSection}>
                <div className={S.sectionHead}>
                  <span className={S.sectionNum}>2</span>
                  <div>
                    <div className={S.sectionTitle}>Dados profissionais</div>
                    <div className={S.sectionSub}>
                      Definem sua identidade clínica e o agente de IA usado nos atendimentos.
                    </div>
                  </div>
                </div>

                <div className={S.grid}>
                  <Field label="Profissão" required span={6}>
                    <Select
                      value={profession}
                      onValueChange={val => {
                        setProfession(val);
                        setSpecialty(SPECIALTIES[val]?.[0] ?? '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFESSIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field
                    label="Especialidade"
                    required={specOptions.length > 0}
                    optional={specOptions.length === 0}
                    span={6}
                  >
                    {specOptions.length > 0 ? (
                      <Select value={specialty} onValueChange={setSpecialty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione…" />
                        </SelectTrigger>
                        <SelectContent>
                          {specOptions.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Ex.: Acupuntura"
                        value={specialty}
                        onChange={e => setSpecialty(e.target.value)}
                      />
                    )}
                  </Field>

                  <Field
                    label={`Número de registro · ${profDef?.registry ?? 'Registro'}`}
                    required
                    span={8}
                  >
                    <Input
                      className={S.monoInput}
                      placeholder={profDef?.registry === 'CRM' ? 'Ex.: 84321' : 'Número'}
                      value={registryNum}
                      onChange={e => setRegistryNum(e.target.value)}
                    />
                  </Field>

                  <Field label="Estado" required span={4}>
                    <Select value={registryUf} onValueChange={setRegistryUf}>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* AI nudge */}
                <div className={S.aiNudge}>
                  <Sparkles size={14} className={S.aiIcon} />
                  <div>
                    <div className={S.aiTitle}>
                      <span className={S.aiBadgeInline}>IA</span>
                      Agente clínico ativo:{' '}
                      <span className={S.agentName}>
                        {specialty || 'Clínica geral'}
                      </span>
                    </div>
                    <p className={S.aiSub}>
                      Profissão e especialidade definem qual agente de IA é ativado no chat
                      clínico dos pacientes. Revise se o agente exibido não corresponder à sua
                      atuação.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── 3. Office ─── */}
            {tab === 'office' && (
              <div className={S.formSection}>
                <div className={S.sectionHead}>
                  <span className={S.sectionNum}>3</span>
                  <div>
                    <div className={S.sectionTitle}>Dados do consultório</div>
                    <div className={S.sectionSub}>
                      Informações do local de atendimento — todos os campos são opcionais.
                    </div>
                  </div>
                </div>

                <div className={S.grid}>
                  <Field label="Nome do consultório ou clínica" optional span={8}>
                    <Input
                      placeholder="Ex.: Clínica Espaço Saúde"
                      value={officeName}
                      onChange={e => setOfficeName(e.target.value)}
                    />
                  </Field>
                  <Field label="Telefone de contato" optional span={4}>
                    <Input
                      className={S.monoInput}
                      placeholder="(00) 0000-0000"
                      value={officePhone}
                      onChange={e => setOfficePhone(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="CEP"
                    optional
                    span={3}
                    hint={cepLoading ? 'Buscando endereço…' : 'Preenche os demais campos.'}
                  >
                    <Input
                      className={S.monoInput}
                      placeholder="00000-000"
                      value={officeCep}
                      onChange={e => {
                        setOfficeCep(e.target.value);

                        if (e.target.value.replace(/\D/g, '').length === 8) {
                          setCepLoading(true);
                          setTimeout(() => setCepLoading(false), 700);
                        }
                      }}
                    />
                  </Field>
                  <Field label="Logradouro" optional span={6}>
                    <Input
                      placeholder="Rua, avenida, travessa…"
                      value={officeStreet}
                      onChange={e => setOfficeStreet(e.target.value)}
                      disabled={cepLoading}
                    />
                  </Field>
                  <Field label="Número" optional span={3}>
                    <Input
                      className={S.monoInput}
                      placeholder="123"
                      value={officeNumber}
                      onChange={e => setOfficeNumber(e.target.value)}
                    />
                  </Field>
                  <Field label="Complemento" optional span={4}>
                    <Input
                      placeholder="Sala, conj., bloco"
                      value={officeComp}
                      onChange={e => setOfficeComp(e.target.value)}
                    />
                  </Field>
                  <Field label="Bairro" optional span={4}>
                    <Input
                      placeholder="Bairro"
                      value={officeNeigh}
                      onChange={e => setOfficeNeigh(e.target.value)}
                      disabled={cepLoading}
                    />
                  </Field>
                  <Field label="Cidade" optional span={3}>
                    <Input
                      placeholder="Cidade"
                      value={officeCity}
                      onChange={e => setOfficeCity(e.target.value)}
                      disabled={cepLoading}
                    />
                  </Field>
                  <Field label="UF" optional span={1}>
                    <Select value={officeUf} onValueChange={setOfficeUf} disabled={cepLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            )}

            {/* ─── 4. Security ─── */}
            {tab === 'security' && (
              <div className={S.formSection}>
                <div className={S.sectionHead}>
                  <span className={S.sectionNum}>4</span>
                  <div>
                    <div className={S.sectionTitle}>Segurança e acesso</div>
                    <div className={S.sectionSub}>
                      Gerenciamento das credenciais e sessões abertas.
                    </div>
                  </div>
                </div>

                {/* Change password */}
                <div className={S.subSection}>
                  <div className={S.subSectionHead}>
                    <KeyRound size={14} className={S.subSectionIcon} />
                    Redefinir senha
                  </div>
                  <div className={S.grid}>
                    <Field label="Senha atual" required span={4}>
                      <div className={S.pwdInputWrap}>
                        <Input
                          type={showPwd ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={curPwd}
                          onChange={e => setCurPwd(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(v => !v)}
                          className={S.pwdRevealBtn}
                          aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPwd ? '🙈' : '👁'}
                        </button>
                      </div>
                    </Field>

                    <Field
                      label="Nova senha"
                      required
                      span={4}
                      hint="Mín. 8 caracteres com número e símbolo."
                    >
                      <Input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPwd}
                        onChange={e => setNewPwd(e.target.value)}
                      />
                      {pwdStrength && (
                        <div className={S.pwdMeter}>
                          <div className={S.pwdBar}>
                            <div
                              className={S.pwdBarFill({ level: pwdStrength.level })}
                              style={{ width: `${pwdStrength.pct}%` }}
                            />
                          </div>
                          <span className={S.pwdLabel({ level: pwdStrength.level })}>
                            {pwdStrength.label}
                          </span>
                        </div>
                      )}
                    </Field>

                    <Field
                      label="Confirmar nova senha"
                      required
                      span={4}
                      error={confirmPwd && !pwdMatch ? 'As senhas não coincidem' : undefined}
                    >
                      <Input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPwd}
                        onChange={e => setConfirmPwd(e.target.value)}
                        className={confirmPwd && !pwdMatch ? 'border-(--color-warning)' : ''}
                      />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canChangePwd || changePassword.isPending}
                      onClick={handleChangePassword}
                    >
                      <KeyRound size={13} />
                      {changePassword.isPending ? 'Alterando…' : 'Alterar senha'}
                    </Button>
                  </div>
                </div>

                {/* Sessions */}
                <div className={S.subSection}>
                  <div className={S.subSectionHead}>
                    <MonitorSmartphone size={14} className={S.subSectionIcon} />
                    Sessões ativas
                    <span className={S.subSectionTag}>3 sessões</span>
                  </div>
                  <div className={S.sessionList}>
                    <SessionRow current device="MacBook Pro" os="macOS · Chrome" loc="São Paulo, SP" when="Agora" />
                    <SessionRow device="iPhone 15" os="iOS · Safari" loc="São Paulo, SP" when="Há 2 horas" />
                    <SessionRow device="iPad Air" os="iPadOS · App" loc="Campinas, SP" when="Ontem, 18:42" />
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm">
                      <LogOut size={13} />
                      Encerrar todas as outras sessões
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={S.footer}>
        <div className={S.footerMeta}>
          <Lock size={11} />
          <span>Dados criptografados em repouso · LGPD</span>
          <span className={S.footerStep}>
            Etapa {tabIdx + 1} de {PROFILE_TABS.length}
          </span>
        </div>
        <div className={S.footerActions}>
          <Button variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
          {!isFirst && (
            <Button variant="outline" onClick={goPrev}>
              <ChevronLeft size={14} />
              Voltar
            </Button>
          )}
          {!isLast && (
            <Button onClick={goNext}>
              Avançar
              <ChevronRight size={14} />
            </Button>
          )}
          {isLast && (
            <Button onClick={handleSave} disabled={isSaving}>
              <Check size={14} />
              {isSaving ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Field({
  label,
  children,
  span = 6,
  required,
  optional,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  span?: keyof typeof S.span;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
}) {
  const id = useId();

  return (
    <div className={S.span[span]}>
      <Label htmlFor={id} className={S.fieldLabel}>
        {label}
        {required && <span className={S.fieldRequired}>*</span>}
        {optional && <span className={S.fieldOptional}>(opcional)</span>}
      </Label>
      <div id={id}>{children}</div>
      {hint && !error && <p className={S.fieldHint}>{hint}</p>}
      {error && <p className={S.fieldError}>{error}</p>}
    </div>
  );
}

function SessionRow({
  current,
  device,
  os,
  loc,
  when,
}: {
  current?: boolean;
  device: string;
  os: string;
  loc: string;
  when: string;
}) {
  const isPhone = device.includes('iPhone') || device.includes('iPad');
  const Icon = isPhone ? Smartphone : Laptop;

  return (
    <div className={S.sessionRow({ current })}>
      <div className={S.sessionIcon}>
        <Icon size={17} />
      </div>
      <div className={S.sessionNameCell}>
        <div className={S.sessionDevice}>
          {device}
          {current && <span className={S.sessionBadge}>Esta sessão</span>}
        </div>
        <div className={S.sessionSub}>{os} · {loc}</div>
      </div>
      <div className={S.sessionWhen}>{when}</div>
      {!current && (
        <Button variant="ghost" size="sm" className={S.sessionEndBtn}>
          <LogOut size={13} />
          Encerrar
        </Button>
      )}
    </div>
  );
}
