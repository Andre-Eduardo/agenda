import {useState, useMemo} from 'react';
import {useSignIn} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useQueryClient} from '@tanstack/react-query';
import {createFileRoute, useNavigate, useRouter} from '@tanstack/react-router';
import {Eye, EyeOff, Lock, Mail, ShieldCheck} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {z} from 'zod';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {useAppStore} from '@/store/appStore';
import {css, cx} from '@/styled-system/css';

export const Route = createFileRoute('/_auth/auth/login')({
    validateSearch: (search: Record<string, unknown>): {redirect?: string} => ({
        redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }),
    component: LoginPage,
});

// ── Styles ────────────────────────────────────────────────────────────────────

const loginRoot = css({
    display: 'grid',
    minH: 'screen',
    gridTemplateColumns: {base: 'repeat(1, minmax(0, 1fr))', lg: '1fr 1.1fr'},
});

const leftPanelRoot = css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    bg: 'bg.card',
    px: '10',
    py: '8',
});

const leftPanelLogo = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2.5',
});

const leftPanelLogoIcon = css({
    display: 'flex',
    h: '7',
    w: '7',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[6px]',
    bg: 'primary',
});

const leftPanelLogoText = css({
    fontSize: 'sm-body',
    fontWeight: 'medium',
    letterSpacing: 'tight',
    color: 'text.primary',
});

const leftPanelTitle = css({
    mb: '1.5',
    fontSize: 'xl',
    fontWeight: 'medium',
    letterSpacing: 'tight',
    color: 'text.primary',
});

const leftPanelSubtitle = css({
    mb: '6',
    lineHeight: 'relaxed',
    fontSize: 'sm',
    color: 'text.secondary',
});

const leftPanelFooter = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    pt: '3.5',
    fontSize: '2xs',
    color: 'text.tertiary',
});

const leftPanelFooterLeft = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1.5',
});

const leftPanelVersion = css({
    fontFamily: 'mono',
});

const form = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '3.5',
});

const fieldLabel = css({
    mb: '1.5',
    display: 'block',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
});

const fieldLabelInline = css({
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
});

const fieldIcon = css({
    position: 'absolute',
    left: '3',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'text.tertiary',
});

const fieldError = css({
    mt: '1',
    fontSize: '2xs',
    color: 'warning',
});

const fieldRevealBtn = css({
    position: 'absolute',
    right: '3',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'text.tertiary',
    _hover: {color: 'text.secondary'},
});

const fieldForgotBtn = css({
    cursor: 'pointer',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'primary',
    _hover: {color: 'primary.hover'},
});

const fieldRememberLabel = css({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '2',
});

const fieldRememberText = css({
    fontSize: 'xs',
    color: 'text.secondary',
});

const fieldCheckbox = css({
    h: '3.5',
    w: '3.5',
    cursor: 'pointer',
    rounded: '[3px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    accentColor: 'var(--color-primary)',
});

const fieldSubmitBtn = css({
    mt: '1',
    w: 'full',
    bg: 'primary',
    fontSize: 'sm',
    fontWeight: 'medium',
    _hover: {bg: 'primary.hover'},
});

const fieldPasswordHeader = css({
    mb: '1.5',
    display: 'flex',
    justifyContent: 'space-between',
});

const fieldInputWrap = css({
    position: 'relative',
});

const usernameInputBase = css({pl: '9', fontSize: 'sm'});
const passwordInputBase = css({pl: '9', pr: '10', fontSize: 'sm'});
const inputWithError = css({borderColor: 'warning'});

const rightPanelRoot = css({
    position: 'relative',
    display: {base: 'none', lg: 'block'},
    overflow: 'hidden',
    bg: 'text.primary',
});

const rightPanelOverlay = css({
    position: 'absolute',
    inset: '0',
    zIndex: '10',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    p: '10',
});

const rightPanelTitle = css({
    mb: '2',
    fontSize: 'xl',
    fontWeight: 'medium',
    lineHeight: 'snug',
    letterSpacing: 'tight',
    color: 'bg.page',
});

const rightPanelHighlight = css({
    color: 'ai.text',
});

const rightPanelDescription = css({
    fontSize: 'xs',
    lineHeight: 'relaxed',
    color: 'text.tertiary',
});

const rightPanelArt = css({
    position: 'absolute',
    inset: '0',
    h: 'full',
    w: 'full',
});

// ── Page ──────────────────────────────────────────────────────────────────────

export function LoginPage() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const router = useRouter();
    const queryClient = useQueryClient();
    const setAuth = useAppStore((s) => s.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const {redirect: redirectTo} = Route.useSearch();

    const schema = useMemo(
        () =>
            z.object({
                username: z.string().min(1, t('auth.login.validation.username.required')),
                password: z.string().min(1, t('auth.login.validation.password.required')),
            }),
        [t]
    );

    type LoginData = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        setError,
        formState: {errors},
    } = useForm<LoginData>({
        mode: 'onSubmit',
        resolver: zodResolver(schema),
    });

    const {mutate: signIn, isPending} = useSignIn({
        mutation: {
            onSuccess: async () => {
                setAuth(true);
                queryClient.clear();
                await router.invalidate();
                await navigate({to: redirectTo ?? '/', replace: true});
            },
            onError: (error: {status?: number}) => {
                if (error.status === 400 || error.status === 401 || error.status === 403) {
                    setError('username', {
                        message: t('auth.login.validation.credentials.invalid'),
                    });
                }
            },
        },
    });

    const onSubmit = (values: LoginData) => signIn({data: values});

    return (
        <div className={loginRoot}>
            {/* Left: form */}
            <div className={leftPanelRoot}>
                {/* Logo */}
                <div className={leftPanelLogo}>
                    <div className={leftPanelLogoIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12h6M12 9v6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className={leftPanelLogoText}>Clínico</span>
                </div>

                {/* Form */}
                <div>
                    <h1 className={leftPanelTitle}>{t('auth.login.title')}</h1>
                    <p className={leftPanelSubtitle}>{t('auth.login.subtitle')}</p>

                    <form onSubmit={handleSubmit(onSubmit)} className={form} noValidate>
                        {/* Username */}
                        <div>
                            <label className={fieldLabel}>{t('auth.login.form.username')}</label>
                            <div className={fieldInputWrap}>
                                <Mail size={13} className={fieldIcon} />
                                <Input
                                    {...register('username')}
                                    type="text"
                                    autoComplete="username"
                                    placeholder="dr.silva"
                                    className={cx(usernameInputBase, errors.username && inputWithError)}
                                />
                            </div>
                            {errors.username?.message && <p className={fieldError}>{errors.username.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <div className={fieldPasswordHeader}>
                                <label className={fieldLabelInline}>{t('auth.login.form.password')}</label>
                                <button type="button" className={fieldForgotBtn}>
                                    {t('auth.login.form.forgotPassword')}
                                </button>
                            </div>
                            <div className={fieldInputWrap}>
                                <Lock size={13} className={fieldIcon} />
                                <Input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    className={cx(passwordInputBase, errors.password?.message && inputWithError)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className={fieldRevealBtn}
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {errors.password?.message && <p className={fieldError}>{errors.password.message}</p>}
                        </div>

                        {/* Remember me */}
                        <label className={fieldRememberLabel}>
                            <input
                                type="checkbox"
                                aria-label={t('auth.login.form.rememberMe')}
                                className={fieldCheckbox}
                            />
                            <span className={fieldRememberText}>{t('auth.login.form.rememberMe')}</span>
                        </label>

                        <Button type="submit" disabled={isPending} className={fieldSubmitBtn}>
                            {isPending ? t('states.loading') : t('auth.login.form.submit')}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <div className={leftPanelFooter}>
                    <div className={leftPanelFooterLeft}>
                        <ShieldCheck size={11} />
                        <span>{t('auth.login.footer.security')}</span>
                    </div>
                    <span className={leftPanelVersion}>v1.0.0</span>
                </div>
            </div>

            {/* Right: decorative panel */}
            <div className={rightPanelRoot}>
                <DecorativeArt />
                <div className={rightPanelOverlay}>
                    <h2 className={rightPanelTitle}>
                        {t('auth.login.panel.title')}
                        <br />
                        <span className={rightPanelHighlight}>{t('auth.login.panel.highlight')}</span>
                    </h2>
                    <p className={rightPanelDescription}>{t('auth.login.panel.description')}</p>
                </div>
            </div>
        </div>
    );
}

function DecorativeArt() {
    return (
        <svg
            className={rightPanelArt}
            viewBox="0 0 480 640"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
        >
            <defs>
                <pattern id="login-dot-grid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="0.9" fill="#334155" />
                </pattern>
            </defs>
            <rect width="480" height="640" fill="url(#login-dot-grid)" opacity="0.5" />
            <circle cx="420" cy="-20" r="200" fill="#0D9488" opacity="0.14" />
            <circle cx="-40" cy="600" r="230" fill="#2563EB" opacity="0.12" />
            <circle cx="400" cy="490" r="120" fill="#1E40AF" opacity="0.16" />
            <path
                d="M 0 320 L 80 320 L 96 296 L 112 348 L 128 264 L 146 356 L 162 316 L 186 320 L 480 320"
                stroke="#0D9488"
                strokeWidth="1.2"
                strokeOpacity="0.45"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <g transform="translate(240, 310)">
                <circle r="175" stroke="#5EEAD4" strokeOpacity="0.07" strokeWidth="0.8" fill="none" />
                <circle r="138" stroke="#5EEAD4" strokeOpacity="0.13" strokeWidth="0.8" fill="none" />
                <circle r="104" stroke="#5EEAD4" strokeOpacity="0.25" strokeWidth="0.9" fill="none" />
                <circle r="70" stroke="#5EEAD4" strokeOpacity="0.42" strokeWidth="0.9" fill="none" />
                <circle r="38" stroke="#5EEAD4" strokeOpacity="0.66" strokeWidth="1" fill="none" />
                <circle r="18" stroke="#5EEAD4" strokeOpacity="0.5" strokeWidth="0.8" fill="none" />
                <circle r="7" fill="#5EEAD4" />
            </g>
            <g transform="translate(240, 310)">
                <circle cx="104" cy="0" r="2.5" fill="#5EEAD4" opacity="0.85" />
                <circle cx="-70" cy="0" r="2" fill="#5EEAD4" opacity="0.7" />
                <circle cx="0" cy="-138" r="2" fill="#5EEAD4" opacity="0.5" />
                <circle cx="0" cy="104" r="2" fill="#5EEAD4" opacity="0.5" />
            </g>
            <circle cx="68" cy="130" r="1.8" fill="#5EEAD4" opacity="0.55" />
            <circle cx="425" cy="152" r="2.2" fill="#5EEAD4" opacity="0.4" />
            <circle cx="76" cy="520" r="1.8" fill="#3B82F6" opacity="0.6" />
            <circle cx="438" cy="464" r="1.8" fill="#5EEAD4" opacity="0.5" />
            <circle cx="218" cy="100" r="1.8" fill="#5EEAD4" opacity="0.45" />
            <circle cx="265" cy="555" r="2.2" fill="#3B82F6" opacity="0.5" />
            <circle cx="42" cy="228" r="1.2" fill="#5EEAD4" opacity="0.35" />
            <circle cx="448" cy="284" r="1.2" fill="#5EEAD4" opacity="0.35" />
            <g stroke="#5EEAD4" strokeWidth="1.2" strokeOpacity="0.55" strokeLinecap="round">
                <line x1="78" y1="210" x2="92" y2="210" />
                <line x1="85" y1="203" x2="85" y2="217" />
            </g>
            <g stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.45" strokeLinecap="round">
                <line x1="400" y1="78" x2="414" y2="78" />
                <line x1="407" y1="71" x2="407" y2="85" />
            </g>
            <g stroke="#5EEAD4" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round">
                <line x1="52" y1="418" x2="64" y2="418" />
                <line x1="58" y1="412" x2="58" y2="424" />
            </g>
        </svg>
    );
}
