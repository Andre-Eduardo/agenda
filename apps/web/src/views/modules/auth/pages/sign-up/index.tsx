import {useMemo, useState} from 'react';
import {useOnboardSolo, useSignIn} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useQueryClient} from '@tanstack/react-query';
import {Link, createFileRoute, useNavigate, useRouter} from '@tanstack/react-router';
import {useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {z} from 'zod';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {useAppStore} from '@/store/appStore';
import {
    authCard,
    authCardError,
    authCardForm,
    authCardLabel,
    authCardLink,
    authCardRoot,
    authCardSubmit,
    authCardSubtitle,
    authCardTitle,
} from '../auth-card.styles';

export const Route = createFileRoute('/_auth/auth/sign-up')({
    component: SignUpPage,
});

/**
 * Self sign-up of an independent professional (autônomo). Creates a solo account in one
 * call (POST /onboarding/solo), then signs in straight into it.
 */
export function SignUpPage() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const router = useRouter();
    const queryClient = useQueryClient();
    const setAuth = useAppStore((s) => s.setAuth);
    const [formError, setFormError] = useState<string | null>(null);

    const schema = useMemo(
        () =>
            z.object({
                name: z.string().trim().min(1, t('auth.signUp.validation.name')),
                email: z.string().trim().email(t('auth.signUp.validation.email')),
                username: z
                    .string()
                    .trim()
                    .min(3, t('auth.signUp.validation.username'))
                    .regex(/^[a-zA-Z0-9._-]+$/, t('auth.signUp.validation.username')),
                password: z
                    .string()
                    .min(8, t('auth.signUp.validation.password'))
                    .regex(/[a-z]/, t('auth.signUp.validation.password'))
                    .regex(/[A-Z]/, t('auth.signUp.validation.password'))
                    .regex(/[0-9]/, t('auth.signUp.validation.password'))
                    .regex(/[^a-zA-Z0-9]/, t('auth.signUp.validation.password')),
                registrationNumber: z.string().trim().optional(),
                specialty: z.string().trim().optional(),
                acceptTerms: z.literal(true, {errorMap: () => ({message: t('auth.signUp.validation.terms')})}),
            }),
        [t]
    );

    type SignUpData = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<SignUpData>({mode: 'onSubmit', resolver: zodResolver(schema)});

    const signIn = useSignIn();
    const onboard = useOnboardSolo();
    const isPending = onboard.isPending || signIn.isPending;

    function errorMessage(status: number | undefined): string {
        if (status === 429) return t('auth.login.validation.rateLimited');

        if (status === 403) return t('auth.signUp.errors.closed');

        if (status === 412 || status === 409) return t('auth.signUp.errors.taken');

        return t('auth.signUp.errors.generic');
    }

    function onSubmit(values: SignUpData) {
        setFormError(null);
        onboard.mutate(
            {
                data: {
                    name: values.name,
                    email: values.email,
                    username: values.username,
                    password: values.password,
                    registrationNumber: values.registrationNumber || null,
                    specialty: values.specialty || null,
                    acceptTerms: true,
                },
            },
            {
                onSuccess: () => {
                    // The new user has a single membership, which sign-in selects on its own.
                    signIn.mutate(
                        {data: {username: values.username, password: values.password}},
                        {
                            onSuccess: () => {
                                setAuth(true);
                                queryClient.clear();
                                void router.invalidate().then(() => navigate({to: '/', replace: true}));
                            },
                            // The account exists; the person can still sign in by hand.
                            onError: () => {
                                void navigate({to: '/auth/login', replace: true});
                            },
                        }
                    );
                },
                onError: (error: {status?: number}) => setFormError(errorMessage(error.status)),
            }
        );
    }

    return (
        <div className={authCardRoot}>
            <div className={authCard}>
                <h1 className={authCardTitle}>{t('auth.signUp.title')}</h1>
                <p className={authCardSubtitle}>{t('auth.signUp.subtitle')}</p>

                <form onSubmit={handleSubmit(onSubmit)} className={authCardForm} noValidate>
                    <div>
                        <label htmlFor="sign-up-name" className={authCardLabel}>
                            {t('auth.signUp.name')}
                        </label>
                        <Input id="sign-up-name" {...register('name')} autoComplete="name" />
                        {errors.name?.message && <p className={authCardError}>{errors.name.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="sign-up-email" className={authCardLabel}>
                            {t('auth.signUp.email')}
                        </label>
                        <Input id="sign-up-email" {...register('email')} type="email" autoComplete="email" />
                        {errors.email?.message && <p className={authCardError}>{errors.email.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="sign-up-username" className={authCardLabel}>
                            {t('auth.signUp.username')}
                        </label>
                        <Input id="sign-up-username" {...register('username')} autoComplete="username" />
                        {errors.username?.message && <p className={authCardError}>{errors.username.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="sign-up-password" className={authCardLabel}>
                            {t('auth.signUp.password')}
                        </label>
                        <Input
                            id="sign-up-password"
                            {...register('password')}
                            type="password"
                            autoComplete="new-password"
                        />
                        {errors.password?.message && <p className={authCardError}>{errors.password.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="sign-up-registration" className={authCardLabel}>
                            {t('auth.signUp.registrationNumber')}
                        </label>
                        <Input
                            id="sign-up-registration"
                            {...register('registrationNumber')}
                            placeholder="CRP 06/12345"
                        />
                    </div>
                    <div>
                        <label htmlFor="sign-up-specialty" className={authCardLabel}>
                            {t('auth.signUp.specialty')}
                        </label>
                        <Input id="sign-up-specialty" {...register('specialty')} />
                    </div>
                    <div>
                        <label className={authCardLabel}>
                            <input type="checkbox" {...register('acceptTerms')} /> {t('auth.signUp.acceptTermsPrefix')}{' '}
                            <Link to="/legal/terms">{t('legal.terms')}</Link> {t('auth.signUp.acceptTermsAnd')}{' '}
                            <Link to="/legal/privacy">{t('legal.privacy')}</Link>
                        </label>
                        {errors.acceptTerms?.message && <p className={authCardError}>{errors.acceptTerms.message}</p>}
                    </div>
                    {formError && (
                        <p className={authCardError} role="alert">
                            {formError}
                        </p>
                    )}
                    <Button type="submit" disabled={isPending} className={authCardSubmit}>
                        {isPending ? t('states.loading') : t('auth.signUp.submit')}
                    </Button>
                </form>

                <Link to="/auth/login" className={authCardLink}>
                    {t('auth.signUp.back')}
                </Link>
            </div>
        </div>
    );
}
