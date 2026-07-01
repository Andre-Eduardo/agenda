import {defineConfig} from '@pandacss/dev';

export default defineConfig({
    preflight: true,

    include: ['./src/**/*.{ts,tsx}'],
    exclude: ['./src/styled-system/**'],

    // Dark mode via classe .dark controlada pelo Zustand colorMode
    conditions: {
        extend: {
            dark: '.dark &',
        },
    },

    theme: {
        extend: {
            tokens: {
                fonts: {
                    sans: {value: "'Inter Variable', system-ui, sans-serif"},
                    mono: {value: "'JetBrains Mono Variable', monospace"},
                },

                fontSizes: {
                    '2xs': {value: '11px'},
                    xs: {value: '12px'},
                    sm: {value: '13px'},
                    'sm-body': {value: '14px'},
                    base: {value: '16px'},
                    sub: {value: '16px'},
                    lead: {value: '18px'},
                    xl: {value: '24px'},
                    '2xl': {value: '36px'},
                },

                radii: {
                    card: {value: '14px'},
                    'card-sm': {value: '10px'},
                    button: {value: '8px'},
                    input: {value: '8px'},
                    data: {value: '8px'},
                    badge: {value: '20px'},
                    modal: {value: '14px'},
                    dropdown: {value: '10px'},
                },

                shadows: {
                    focus: {value: '0 0 0 2px #2563eb'},
                    dropdown: {value: '0 4px 12px rgba(0, 0, 0, 0.08)'},
                },

                durations: {
                    fast: {value: '120ms'},
                    base: {value: '200ms'},
                    slow: {value: '300ms'},
                },

                easings: {
                    DEFAULT: {value: 'ease-out'},
                },

                spacing: {
                    'padding-card': {value: '16px'},
                    'padding-section': {value: '12px'},
                    'padding-data-block': {value: '10px'},
                    'gap-elements': {value: '12px'},
                },
            },

            semanticTokens: {
                colors: {
                    // ── Superfícies ──────────────────────────────────────────
                    bg: {
                        page: {value: {base: '#f8fafc', _dark: '#020617'}},
                        surface: {value: {base: '#f1f5f9', _dark: '#0f172a'}},
                        card: {value: {base: '#ffffff', _dark: '#1e293b'}},
                    },

                    // ── Bordas ───────────────────────────────────────────────
                    border: {
                        DEFAULT: {value: {base: '#e2e8f0', _dark: '#334155'}},
                        hover: {value: {base: '#cbd5e1', _dark: '#475569'}},
                    },

                    // ── Texto ────────────────────────────────────────────────
                    text: {
                        primary: {value: {base: '#0f172a', _dark: '#f8fafc'}},
                        secondary: {value: {base: '#64748b', _dark: '#94a3b8'}},
                        tertiary: {value: {base: '#94a3b8', _dark: '#475569'}},
                    },

                    // ── Primária — azul clínico ──────────────────────────────
                    primary: {
                        DEFAULT: {value: {base: '#2563eb', _dark: '#2563eb'}},
                        hover: {value: {base: '#1d4ed8', _dark: '#1d4ed8'}},
                        surface: {value: {base: '#eff6ff', _dark: '#1e3a8a'}},
                        border: {value: {base: '#bfdbfe', _dark: '#2563eb'}},
                        text: {value: {base: '#1e40af', _dark: '#93c5fd'}},
                        foreground: {value: {base: '#ffffff', _dark: '#ffffff'}},
                    },

                    // ── Accent IA — teal (exclusivo para AIBlock) ────────────
                    ai: {
                        bg: {value: {base: '#f0fdfa', _dark: '#134e4a'}},
                        border: {value: {base: '#0d9488', _dark: '#0d9488'}},
                        text: {value: {base: '#115e59', _dark: '#5eead4'}},
                        badgeBg: {value: {base: '#0d9488', _dark: '#0d9488'}},
                        badgeText: {value: {base: '#ffffff', _dark: '#ffffff'}},
                    },

                    // ── Semânticas ───────────────────────────────────────────
                    success: {
                        DEFAULT: {value: {base: '#10b981', _dark: '#10b981'}},
                        surface: {value: {base: '#ecfdf5', _dark: '#ecfdf5'}},
                    },
                    warning: {
                        DEFAULT: {value: {base: '#f59e0b', _dark: '#f59e0b'}},
                        surface: {value: {base: '#fffbeb', _dark: '#fffbeb'}},
                    },
                    danger: {
                        DEFAULT: {value: {base: '#ef4444', _dark: '#ef4444'}},
                        surface: {value: {base: '#fef2f2', _dark: '#fef2f2'}},
                    },
                    info: {
                        DEFAULT: {value: {base: '#06b6d4', _dark: '#06b6d4'}},
                        surface: {value: {base: '#ecfeff', _dark: '#ecfeff'}},
                    },

                    // ── Confiança IA ─────────────────────────────────────────
                    confidence: {
                        high: {value: {base: '#10b981', _dark: '#10b981'}},
                        mid: {value: {base: '#f59e0b', _dark: '#f59e0b'}},
                        low: {value: {base: '#ef4444', _dark: '#ef4444'}},
                    },

                    // ── shadcn/ui compatibility ──────────────────────────────
                    background: {value: {base: '#f8fafc', _dark: '#020617'}},
                    foreground: {value: {base: '#0f172a', _dark: '#f8fafc'}},
                    card: {value: {base: '#ffffff', _dark: '#1e293b'}},
                    'card-foreground': {value: {base: '#0f172a', _dark: '#f8fafc'}},
                    popover: {value: {base: '#ffffff', _dark: '#1e293b'}},
                    'popover-foreground': {value: {base: '#0f172a', _dark: '#f8fafc'}},
                    muted: {value: {base: '#f1f5f9', _dark: '#0f172a'}},
                    'muted-foreground': {value: {base: '#64748b', _dark: '#94a3b8'}},
                    accent: {value: {base: '#f1f5f9', _dark: '#0f172a'}},
                    'accent-foreground': {value: {base: '#0f172a', _dark: '#f8fafc'}},
                    destructive: {value: {base: '#ef4444', _dark: '#ef4444'}},
                    'destructive-foreground': {value: {base: '#ffffff', _dark: '#ffffff'}},
                    input: {value: {base: '#e2e8f0', _dark: '#334155'}},
                    ring: {value: {base: '#2563eb', _dark: '#2563eb'}},
                    secondary: {value: {base: '#f1f5f9', _dark: '#0f172a'}},
                    'secondary-foreground': {value: {base: '#0f172a', _dark: '#f8fafc'}},
                },
            },
        },
    },

    globalCss: {
        body: {
            backgroundColor: 'token(colors.bg.page)',
            color: 'token(colors.text.primary)',
            fontFamily: 'token(fonts.sans)',
            fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
        },
    },

    jsxFramework: 'react',
    outdir: 'src/styled-system',
    importMap: '@/styled-system',
});
