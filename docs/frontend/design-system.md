# Design System — App de Saúde
**Versão:** 1.0 · **Gerado em:** abril 2026  
**Stack:** shadcn/ui · Tailwind CSS v4 · Radix UI · Recharts · react-day-picker

---

## 1. Princípios do produto

App destinado a profissionais de saúde (médicos, psicólogos, fisioterapeutas e outras especialidades) para gestão de pacientes, prontuário clínico e análise assistida por IA.

**Personalidade visual:** *professional modern* — estrutura convencional e previsível (familiar para veteranos de sistemas clínicos), execução visual em padrão atual (moderno para quem ingressa no mercado hoje).

**Princípio de IA:** assistiva, nunca autônoma. Todo conteúdo gerado por IA deve ser visualmente identificável e aguardar revisão humana obrigatória antes de se tornar registro clínico oficial. O accent teal sinaliza exclusivamente presença de IA no sistema.

---

## 2. Stack técnica

| Camada | Tecnologia | Observação |
|--------|-----------|-----------|
| Componentes base | shadcn/ui | Componentes vivem no repositório |
| Utilitários CSS | Tailwind CSS v4 | Configuração via CSS (`@theme`) |
| Primitives acessíveis | Radix UI | Bundled com shadcn |
| Gráficos clínicos | Recharts | Compatível com shadcn/ui charts |
| Calendário / agenda | react-day-picker | v9+ com Tailwind |
| Ícones | Lucide Icons | Bundled com shadcn |
| Fonte UI | Inter | Variable font |
| Fonte dados clínicos | JetBrains Mono | Variable font |

---

## 3. Tokens de cor

### 3.1 Paleta neutra — Slate

Cinza com viés azulado sutil. Base para todos os backgrounds, bordas e texto.

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-bg-page` | `#F8FAFC` | Background de página (modo claro) |
| `--color-bg-surface` | `#F1F5F9` | Painel lateral, seção de conteúdo |
| `--color-bg-card` | `#FFFFFF` | Card de conteúdo principal |
| `--color-border` | `#E2E8F0` | Borda padrão (repouso) |
| `--color-border-hover` | `#CBD5E1` | Borda em hover / emphasis |
| `--color-text-primary` | `#0F172A` | Texto principal |
| `--color-text-secondary` | `#64748B` | Texto secundário / muted |
| `--color-text-tertiary` | `#94A3B8` | Timestamps, placeholders, metadados |

#### Modo escuro — Slate

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-bg-page` | `#020617` | Background de página — nunca preto puro |
| `--color-bg-surface` | `#0F172A` | Painel lateral, seção |
| `--color-bg-card` | `#1E293B` | Card de conteúdo |
| `--color-border` | `#334155` | Borda padrão |
| `--color-border-hover` | `#475569` | Borda em hover |
| `--color-text-primary` | `#F8FAFC` | Texto principal |
| `--color-text-secondary` | `#94A3B8` | Texto secundário |
| `--color-text-tertiary` | `#475569` | Metadados |

### 3.2 Cor primária — Azul clínico

Confiança médica. Usado em ações primárias, links, badges de status e navegação ativa.

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-primary` | `#2563EB` | Botão primário, links ativos |
| `--color-primary-hover` | `#1D4ED8` | Hover do botão primário |
| `--color-primary-surface` | `#EFF6FF` | Background de badge primário (claro) |
| `--color-primary-border` | `#BFDBFE` | Borda de badge primário (claro) |
| `--color-primary-text` | `#1E40AF` | Texto em superfície azul clara |
| `--color-primary-surface-dark` | `#1E3A8A` | Background de badge primário (escuro) |
| `--color-primary-text-dark` | `#93C5FD` | Texto em superfície azul escura |

### 3.3 Accent IA — Teal

**Uso exclusivo para conteúdo gerado ou assistido por IA.** Não deve ser reutilizado para outros fins semânticos no sistema.

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-ai-bg` | `#F0FDFA` | Background do bloco de IA (claro) |
| `--color-ai-border` | `#0D9488` | Borda lateral do bloco de IA |
| `--color-ai-text` | `#115E59` | Texto dentro do bloco de IA (claro) |
| `--color-ai-badge-bg` | `#0D9488` | Background do badge "IA" |
| `--color-ai-badge-text` | `#FFFFFF` | Texto do badge "IA" |
| `--color-ai-bg-dark` | `#134E4A` | Background do bloco de IA (escuro) |
| `--color-ai-text-dark` | `#5EEAD4` | Texto dentro do bloco de IA (escuro) |

### 3.4 Cores semânticas

| Semântica | Hex | Uso clínico específico |
|-----------|-----|----------------------|
| `--color-success` `#10B981` | emerald-500 | Alta, aprovado, registro salvo |
| `--color-success-surface` `#ECFDF5` | emerald-50 | Background de badge de sucesso |
| `--color-warning` `#F59E0B` | amber-500 | Campos com baixa confiança, atenção |
| `--color-warning-surface` `#FFFBEB` | amber-50 | Background de badge de alerta |
| `--color-danger` `#EF4444` | red-500 | **Somente alertas clínicos reais**: alergias, interações medicamentosas, valores críticos |
| `--color-danger-surface` `#FEF2F2` | red-50 | Background de badge de perigo |
| `--color-info` `#06B6D4` | cyan-500 | Informativo neutro, tooltips |
| `--color-info-surface` `#ECFEFF` | cyan-50 | Background de badge informativo |

> **Regra crítica:** `--color-danger` não deve ser usado para erros de validação de formulário. Use `--color-warning` para isso. Danger é reservado para alertas com implicação clínica real.

### 3.5 Tokens de confiança de IA

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-confidence-high` | `#10B981` | Campo com alta confiança da IA |
| `--color-confidence-mid` | `#F59E0B` | Campo com confiança moderada |
| `--color-confidence-low` | `#EF4444` | Campo com baixa confiança — requer revisão |

---

## 4. Tipografia

### 4.1 Famílias tipográficas

| Família | Variável CSS | Uso |
|---------|-------------|-----|
| **Inter** | `--font-sans` | Toda a interface — textos, labels, botões, formulários |
| **JetBrains Mono** | `--font-mono` | Dados clínicos — PA, FC, SpO₂, dosagens, IDs, timestamps |

**Pesos usados:** `400` (regular) e `500` (medium) **apenas**. Nunca usar 600, 700 ou bold — ficam pesados demais na interface.

Habilitar `font-variant-numeric: tabular-nums` em qualquer coluna ou tabela com dados numéricos para alinhamento correto.

### 4.2 Escala tipográfica — Inter (UI)

| Variável | Tamanho | Peso | Line-height | Uso |
|----------|---------|------|-------------|-----|
| `--text-2xl` | `36px` | 500 | 1.2 | Título de página, dashboard header |
| `--text-xl` | `24px` | 500 | 1.3 | Título de seção principal |
| `--text-lead` | `18px` | 500 | 1.3 | Nome do paciente, card title |
| `--text-sub` | `16px` | 500 | 1.4 | Subtítulo, destaque de seção |
| `--text-base` | `16px` | 400 | 1.6 | Corpo de texto, texto de evolução clínica |
| `--text-sm-body` | `14px` | 400 | 1.6 | Corpo secundário, anamnese |
| `--text-sm` | `13px` | 400 | 1.5 | Labels, captions, descrições de campo |
| `--text-xs` | `12px` | 500 | 1.4 | Badges, tags, chips de status |
| `--text-2xs` | `11px` | 400 | 1.4 | Timestamps, metadados, origem do registro |

### 4.3 Escala tipográfica — JetBrains Mono (dados clínicos)

| Tamanho | Peso | Uso |
|---------|------|-----|
| `14px` | 400 | Valores vitais em destaque: PA, FC, SpO₂, temperatura |
| `13px` | 400 | Dosagens em tabela, timestamps de sistema |
| `12px` | 400 | IDs de paciente, número de consulta, códigos |

---

## 5. Espaçamento e densidade

**Base unit:** `4px`

### Dois modos de densidade

| Token | Confortável (padrão) | Compacto (opcional) |
|-------|---------------------|---------------------|
| `--padding-card` | `16px` | `10px` |
| `--padding-section` | `12px` | `8px` |
| `--padding-data-block` | `10px` | `7px` |
| `--gap-elements` | `12px` | `8px` |

**Modo confortável** é o padrão para todos os usuários. O modo compacto é configurável individualmente nas preferências do usuário — nunca imposto globalmente.

---

## 6. Raio de borda

**Padrão escolhido: Suave**

| Elemento | Token CSS | Valor |
|----------|-----------|-------|
| Card principal | `--radius-card` | `14px` |
| Card secundário / mini | `--radius-card-sm` | `10px` |
| Botão | `--radius-button` | `8px` |
| Input / Select | `--radius-input` | `8px` |
| Bloco de dados mono | `--radius-data` | `8px` |
| Badge / chip / pill | `--radius-badge` | `20px` |
| Modal / Dialog | `--radius-modal` | `14px` |
| Dropdown / Popover | `--radius-dropdown` | `10px` |
| Bloco de IA (AIBlock) | — | `0` — borda esquerda accent não combina com cantos arredondados |

---

## 7. Sombra e elevação

**Princípio:** hierarquia por cor de superfície, não por sombra decorativa. Cards se destacam pelo contraste entre `bg-page → bg-surface → bg-card`, não por `box-shadow`.

| Uso | Token CSS | Valor |
|-----|-----------|-------|
| Cards e painéis | `--shadow-none` | `none` |
| Focus ring (inputs, botões) | `--shadow-focus` | `0 0 0 2px #2563EB` |
| Dropdown / Popover | `--shadow-dropdown` | `0 4px 12px rgba(0, 0, 0, 0.08)` |
| Modal overlay (fundo) | — | `rgba(0, 0, 0, 0.4)` |

---

## 8. Motion

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--duration-fast` | `120ms` | Hover, active states, micro-interações |
| `--duration-base` | `200ms` | Toggle, abrir/fechar componentes, loading states |
| `--duration-slow` | `300ms` | Modais, slides, transições de rota |
| `--ease` | `ease-out` | **Todos os casos** — entra rápido, desacelera |

---

## 9. Ícones

**Biblioteca:** Lucide Icons (integrado com shadcn/ui).

| Contexto | Tamanho | Classe Tailwind |
|----------|---------|----------------|
| Inline em texto ou label | `16px` | `size-4` |
| Botão com ícone | `20px` | `size-5` |
| Ação standalone / nav item | `24px` | `size-6` |
| Decorativo / vazio state | `32px` | `size-8` |

Stroke width padrão: `1.5px` (Lucide default — não alterar).

---

## 10. Padrões clínicos de IA

### 10.1 Componente AIBlock

Todo conteúdo gerado por IA usa este padrão visual consistente:

```
┌─[borda esquerda 3px teal-600]─────────────────────────────┐
│ fundo: --color-ai-bg (claro) / --color-ai-bg-dark (escuro) │
│                                                             │
│  [badge "IA" teal] Gerado por IA · aguarda revisão         │
│                                                             │
│  Texto do conteúdo em --color-ai-text                      │
└─────────────────────────────────────────────────────────────┘
```

**CSS crítico:**
```css
border-left: 3px solid var(--color-ai-border);
border-radius: 0;   /* nunca arredondar — regra absoluta */
background: var(--color-ai-bg);
```

### 10.2 Estados do conteúdo clínico

| Estado | Marcação visual | Ação disponível |
|--------|-----------------|-----------------|
| Aguarda revisão | AIBlock com teal + badge "IA" | Aprovar / Editar |
| Baixa confiança | Campos com borda `--color-danger` + ícone de alerta | Revisar campos |
| Revisado e aprovado | Badge success "Aprovado" | — |
| Registro oficial | Sem marcação de IA — entra no prontuário normal | Editar |
| Evidência insuficiente | Badge warning + texto explicativo | — |

### 10.3 Indicador de confiança por campo

Campos extraídos por OCR ou sugeridos por IA devem exibir indicador visual de confiança:

```
Alta confiança:   borda verde  + ícone check     (--color-confidence-high)
Média confiança:  borda âmbar  + ícone alerta     (--color-confidence-mid)
Baixa confiança:  borda vermelha + ícone erro     (--color-confidence-low)
```

Texto de suporte abaixo do formulário: `"X campos com baixa confiança — revisão necessária"`

### 10.4 Seleção de agente por profissão

O frontend **não deve** permitir seleção manual de agente de IA. O backend resolve automaticamente o agente correto baseado no perfil do profissional. O frontend exibe apenas o nome do agente resolvido, de forma informativa.

---

## 11. Globals CSS (implementação)

```css
/* src/app/globals.css */

@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme {
  /* Fontes */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Escala tipográfica */
  --text-2xs: 11px;
  --text-xs: 12px;
  --text-sm: 13px;
  --text-sm-body: 14px;
  --text-base: 16px;
  --text-sub: 16px;
  --text-lead: 18px;
  --text-xl: 24px;
  --text-2xl: 36px;

  /* Raios */
  --radius-card: 14px;
  --radius-card-sm: 10px;
  --radius-button: 8px;
  --radius-input: 8px;
  --radius-data: 8px;
  --radius-badge: 20px;
  --radius-modal: 14px;
  --radius-dropdown: 10px;
  --radius: 8px; /* shadcn base */

  /* Motion */
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  --ease: ease-out;

  /* Sombras */
  --shadow-focus: 0 0 0 2px #2563EB;
  --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.08);

  /* Espaçamento — modo confortável (padrão) */
  --padding-card: 16px;
  --padding-section: 12px;
  --padding-data-block: 10px;
  --gap-elements: 12px;
}

@layer base {
  :root {
    /* ── Superfícies ── */
    --color-bg-page:     #F8FAFC;
    --color-bg-surface:  #F1F5F9;
    --color-bg-card:     #FFFFFF;

    /* ── Bordas ── */
    --color-border:       #E2E8F0;
    --color-border-hover: #CBD5E1;

    /* ── Texto ── */
    --color-text-primary:   #0F172A;
    --color-text-secondary: #64748B;
    --color-text-tertiary:  #94A3B8;

    /* ── Primária — azul clínico ── */
    --color-primary:              #2563EB;
    --color-primary-hover:        #1D4ED8;
    --color-primary-surface:      #EFF6FF;
    --color-primary-border:       #BFDBFE;
    --color-primary-text:         #1E40AF;

    /* ── Accent IA — teal ── */
    --color-ai-bg:          #F0FDFA;
    --color-ai-border:      #0D9488;
    --color-ai-text:        #115E59;
    --color-ai-badge-bg:    #0D9488;
    --color-ai-badge-text:  #FFFFFF;

    /* ── Semânticas ── */
    --color-success:          #10B981;
    --color-success-surface:  #ECFDF5;
    --color-warning:          #F59E0B;
    --color-warning-surface:  #FFFBEB;
    --color-danger:           #EF4444;
    --color-danger-surface:   #FEF2F2;
    --color-info:             #06B6D4;
    --color-info-surface:     #ECFEFF;

    /* ── Confiança IA ── */
    --color-confidence-high: #10B981;
    --color-confidence-mid:  #F59E0B;
    --color-confidence-low:  #EF4444;

    /* ── shadcn compatibility ── */
    --background:         #F8FAFC;
    --foreground:         #0F172A;
    --card:               #FFFFFF;
    --card-foreground:    #0F172A;
    --muted:              #F1F5F9;
    --muted-foreground:   #64748B;
    --border:             #E2E8F0;
    --input:              #E2E8F0;
    --primary:            #2563EB;
    --primary-foreground: #FFFFFF;
    --ring:               #2563EB;
  }

  .dark {
    /* ── Superfícies ── */
    --color-bg-page:     #020617;
    --color-bg-surface:  #0F172A;
    --color-bg-card:     #1E293B;

    /* ── Bordas ── */
    --color-border:       #334155;
    --color-border-hover: #475569;

    /* ── Texto ── */
    --color-text-primary:   #F8FAFC;
    --color-text-secondary: #94A3B8;
    --color-text-tertiary:  #475569;

    /* ── Primária dark ── */
    --color-primary-surface:  #1E3A8A;
    --color-primary-border:   #2563EB;
    --color-primary-text:     #93C5FD;

    /* ── Accent IA dark ── */
    --color-ai-bg:    #134E4A;
    --color-ai-text:  #5EEAD4;

    /* ── shadcn compatibility ── */
    --background:       #020617;
    --foreground:       #F8FAFC;
    --card:             #1E293B;
    --card-foreground:  #F8FAFC;
    --muted:            #0F172A;
    --muted-foreground: #94A3B8;
    --border:           #334155;
    --input:            #334155;
    --ring:             #2563EB;
  }
}
```

---

## 12. Componentes shadcn a instalar

```bash
# Base
npx shadcn@latest add button card badge input select textarea label form
npx shadcn@latest add dialog sheet dropdown-menu separator skeleton tooltip avatar tabs

# Feedback e navegação
npx shadcn@latest add toast sonner progress
npx shadcn@latest add command popover

# Dados e layout
npx shadcn@latest add table scroll-area
```

---

## 13. Mapa de componentes clínicos customizados

Componentes que precisam ser construídos além do shadcn base:

| Componente | Arquivo sugerido | Descrição |
|------------|-----------------|-----------|
| `AIBlock` | `components/clinical/ai-block.tsx` | Bloco de pré-evolução gerada por IA com badge teal e border-left |
| `ConfidenceIndicator` | `components/clinical/confidence-indicator.tsx` | Indicador por campo: alto/médio/baixo |
| `PatientCard` | `components/clinical/patient-card.tsx` | Card de resumo com vitais em mono |
| `VitalsDisplay` | `components/clinical/vitals-display.tsx` | Grid de valores vitais em JetBrains Mono |
| `ClinicalRecord` | `components/clinical/clinical-record.tsx` | Entrada de prontuário estruturado SOAP |
| `MedicalTimeline` | `components/clinical/medical-timeline.tsx` | Histórico cronológico de evoluções |
| `DynamicForm` | `components/clinical/dynamic-form.tsx` | Formulário por especialidade via schema JSON |
| `DocumentReview` | `components/clinical/document-review.tsx` | Revisão de OCR com campos editáveis e score de confiança |
| `ClinicalChat` | `components/clinical/clinical-chat.tsx` | Chat com RAG e contexto do paciente |
| `AgendaCalendar` | `components/agenda/agenda-calendar.tsx` | Calendário de consultas com react-day-picker |

---

## 14. Hierarquia de superfícies e layout

```
Página         bg: --color-bg-page     border: none
  └── Painel   bg: --color-bg-surface  border: none
        └── Card  bg: --color-bg-card  border: 0.5px solid --color-border
              └── Bloco inline  bg: --color-bg-surface  border-radius: --radius-data
```

### Três níveis de borda

```css
/* Repouso */
border: 0.5px solid var(--color-border);

/* Hover / emphasis */
border: 0.5px solid var(--color-border-hover);

/* Accent primário (ex: card selecionado) */
border: 2px solid var(--color-primary);

/* Accent IA — sempre border-left, nunca border-radius */
border-left: 3px solid var(--color-ai-border);
border-radius: 0;
```

---

## 15. Diretrizes para agentes de código

Ao usar este documento como contexto no Claude Code ou outro agente:

1. **Nunca usar cores hardcoded.** Sempre usar `var(--color-nome-do-token)` ou classes Tailwind mapeadas.

2. **Conteúdo de IA usa exclusivamente o grupo `ai-*`.** `var(--color-ai-bg)`, `var(--color-ai-border)`, `var(--color-ai-text)`. Nenhuma outra cor deve sinalizar conteúdo de IA.

3. **Raio de borda via tokens.** Usar `var(--radius-card)`, `var(--radius-button)`, `var(--radius-badge)`, `var(--radius-input)` conforme o elemento. Nunca valores arbitrários.

4. **Sombra nunca em cards.** `box-shadow: none` nos cards e painéis. `var(--shadow-dropdown)` apenas em popovers e dropdowns.

5. **Dois pesos de fonte apenas.** `font-weight: 400` e `font-weight: 500`. Nunca `600`, `700` ou `bold`.

6. **Dados clínicos sempre em mono.** Qualquer valor numérico clínico (PA, FC, SpO₂, dosagem, ID de paciente) usa `font-family: var(--font-mono)` com `font-variant-numeric: tabular-nums`.

7. **Bloco de IA tem `border-radius: 0`.** O `border-left` accent é incompatível com cantos arredondados.

8. **Dark mode via classe `dark` no `<html>`.** Não usar `prefers-color-scheme` diretamente nos componentes. ThemeProvider controla a classe.

9. **Background escuro é `#020617`, nunca `#000000`.** `var(--color-bg-page)` no dark resolve para slate-950.

10. **Motion sempre `ease-out`** com os três tokens: `var(--duration-fast)` para hover, `var(--duration-base)` para toggle/abrir, `var(--duration-slow)` para modal e transição de rota.

11. **Danger é reservado para alertas clínicos reais.** Erros de validação de formulário usam warning, não danger.

12. **Agente de IA é resolvido pelo backend.** O frontend não oferece seleção de agente — exibe apenas o nome do agente resolvido de forma informativa.

---

*Este documento é o contrato de design para toda a implementação do app de saúde. Alterações nos tokens devem ser feitas no `globals.css` e refletidas aqui.*
