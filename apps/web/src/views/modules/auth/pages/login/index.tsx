import {useState, useMemo} from 'react';
import {useSignIn} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useQueryClient} from '@tanstack/react-query';
import {createFileRoute, Link, useNavigate, useRouter} from '@tanstack/react-router';
import {Eye, EyeOff, FileText, Lock, Mail, ShieldCheck, Stethoscope} from 'lucide-react';
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
    color: 'primary.foreground',
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
    display: {base: 'none', lg: 'block'},
    bg: 'bg.surface',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'border',
});

const rightPanelOverlay = css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '8',
    h: 'full',
    maxW: '[620px]',
    mx: 'auto',
    p: '10',
});

const rightPanelTitle = css({
    mb: '3',
    fontSize: '2xl',
    fontWeight: 'medium',
    lineHeight: 'tight',
    color: 'text.primary',
});

const rightPanelHighlight = css({color: 'text.primary'});

const rightPanelDescription = css({
    fontSize: 'sm-body',
    lineHeight: 'relaxed',
    color: 'text.secondary',
});

const previewFrame = css({
    w: 'full',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    overflow: 'hidden',
});

const previewTopBar = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    px: '5',
    py: '3',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    fontSize: 'xs',
    color: 'text.primary',
});

const previewBrandIcon = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    w: '6',
    h: '6',
    rounded: '[6px]',
    bg: 'primary',
    color: 'primary.foreground',
});

const previewDate = css({ml: 'auto', fontFamily: 'mono', color: 'text.secondary'});
const previewContent = css({p: '6'});
const previewHeading = css({mb: '4', fontSize: 'sm-body', fontWeight: 'medium', color: 'text.primary'});
const previewTimeline = css({
    display: 'grid',
    gridTemplateColumns: '52px minmax(0, 1fr)',
    alignItems: 'center',
    rowGap: '2',
    columnGap: '3',
});
const previewTime = css({fontFamily: 'mono', fontSize: 'xs', color: 'text.secondary'});
const previewSlot = css({h: '10', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: 'border'});
const previewAppointment = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    px: '3',
    h: '10',
    rounded: 'button',
    bg: 'primary.surface',
    color: 'primary.text',
    fontSize: 'xs',
    fontWeight: 'medium',
});
const previewDot = css({w: '2', h: '2', rounded: 'full', bg: 'primary'});
const previewRecord = css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    mt: '5',
    pt: '4',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    color: 'text.secondary',
});
const previewRecordTitle = css({fontSize: 'xs', fontWeight: 'medium', color: 'text.primary'});
const previewRecordSub = css({fontSize: 'xs', color: 'text.secondary'});

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
                if (error.status === 429) {
                    setError('username', {message: t('auth.login.validation.rateLimited')});

                    return;
                }

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
                        <Stethoscope size={16} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <span className={leftPanelLogoText}>Agenda Saúde</span>
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
                                <Link to="/auth/forgot-password" className={fieldForgotBtn}>
                                    {t('auth.login.form.forgotPassword')}
                                </Link>
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
                    <nav className={leftPanelFooterLeft} aria-label={t('legal.navLabel')}>
                        <Link to="/legal/privacy">{t('legal.privacy')}</Link>
                        <span aria-hidden="true">·</span>
                        <Link to="/legal/terms">{t('legal.terms')}</Link>
                    </nav>
                    <span className={leftPanelVersion}>v1.0.0</span>
                </div>
            </div>

            {/* Right: product preview */}
            <div className={rightPanelRoot}>
                <div className={rightPanelOverlay}>
                    <div className={previewFrame} aria-hidden="true">
                        <div className={previewTopBar}>
                            <span className={previewBrandIcon}>
                                <Stethoscope size={14} strokeWidth={1.5} />
                            </span>
                            <span>Agenda Saúde</span>
                            <span className={previewDate}>{t('auth.login.preview.today')}</span>
                        </div>
                        <div className={previewContent}>
                            <div className={previewHeading}>{t('auth.login.preview.agenda')}</div>
                            <div className={previewTimeline}>
                                <span className={previewTime}>09:00</span>
                                <span className={previewSlot} />
                                <span className={previewTime}>10:00</span>
                                <span className={previewAppointment}>
                                    <span className={previewDot} />
                                    {t('auth.login.preview.appointment')}
                                </span>
                                <span className={previewTime}>11:00</span>
                                <span className={previewSlot} />
                            </div>
                            <div className={previewRecord}>
                                <FileText size={16} strokeWidth={1.5} />
                                <div>
                                    <div className={previewRecordTitle}>{t('auth.login.preview.record')}</div>
                                    <div className={previewRecordSub}>{t('auth.login.preview.review')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className={rightPanelTitle}>
                            {t('auth.login.panel.title')}
                            <br />
                            <span className={rightPanelHighlight}>{t('auth.login.panel.highlight')}</span>
                        </h2>
                        <p className={rightPanelDescription}>{t('auth.login.panel.description')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
