import {useMemo, useState} from 'react';
import {useResetPassword} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {Link, createFileRoute, useNavigate} from '@tanstack/react-router';
import {useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {z} from 'zod';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {
    authCard,
    authCardError,
    authCardForm,
    authCardLabel,
    authCardLink,
    authCardNotice,
    authCardRoot,
    authCardSubmit,
    authCardSubtitle,
    authCardTitle,
} from '../auth-card.styles';

export const Route = createFileRoute('/_auth/auth/reset-password')({
    validateSearch: (search: Record<string, unknown>): {token?: string} => ({
        token: typeof search.token === 'string' ? search.token : undefined,
    }),
    component: ResetPasswordPage,
});

// Mirrors the server rule (ObfuscatedPassword.validate): 8+ chars, upper, lower, number, symbol.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function ResetPasswordPage() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {token} = Route.useSearch();
    const [invalidLink, setInvalidLink] = useState(token === undefined);

    const schema = useMemo(
        () =>
            z
                .object({
                    newPassword: z.string().regex(STRONG_PASSWORD, t('auth.resetPassword.validation.password')),
                    confirmPassword: z.string(),
                })
                .refine((values) => values.newPassword === values.confirmPassword, {
                    path: ['confirmPassword'],
                    message: t('auth.resetPassword.validation.mismatch'),
                }),
        [t]
    );

    type ResetPasswordData = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        setError,
        formState: {errors},
    } = useForm<ResetPasswordData>({mode: 'onSubmit', resolver: zodResolver(schema)});

    const {mutate: resetPassword, isPending} = useResetPassword({
        mutation: {
            onSuccess: async () => {
                toast.success(t('auth.resetPassword.success'));
                await navigate({to: '/auth/login', replace: true});
            },
            onError: (error: {status?: number}) => {
                if (error.status === 429) {
                    setError('newPassword', {message: t('auth.login.validation.rateLimited')});
                } else if (error.status === 400) {
                    setError('newPassword', {message: t('auth.resetPassword.validation.password')});
                } else {
                    setInvalidLink(true);
                }
            },
        },
    });

    const onSubmit = ({newPassword}: ResetPasswordData) => {
        if (token === undefined) return;

        resetPassword({data: {token, newPassword}});
    };

    return (
        <div className={authCardRoot}>
            <div className={authCard}>
                <h1 className={authCardTitle}>{t('auth.resetPassword.title')}</h1>

                {invalidLink ? (
                    <>
                        <p className={authCardNotice} role="alert">
                            {t('auth.resetPassword.invalidLink')}
                        </p>
                        <Link to="/auth/forgot-password" className={authCardLink}>
                            {t('auth.resetPassword.requestNew')}
                        </Link>
                    </>
                ) : (
                    <>
                        <p className={authCardSubtitle}>{t('auth.resetPassword.subtitle')}</p>
                        <form onSubmit={handleSubmit(onSubmit)} className={authCardForm} noValidate>
                            <div>
                                <label htmlFor="reset-password" className={authCardLabel}>
                                    {t('auth.resetPassword.password')}
                                </label>
                                <Input
                                    id="reset-password"
                                    {...register('newPassword')}
                                    type="password"
                                    autoComplete="new-password"
                                />
                                {errors.newPassword?.message && (
                                    <p className={authCardError}>{errors.newPassword.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="reset-password-confirm" className={authCardLabel}>
                                    {t('auth.resetPassword.confirm')}
                                </label>
                                <Input
                                    id="reset-password-confirm"
                                    {...register('confirmPassword')}
                                    type="password"
                                    autoComplete="new-password"
                                />
                                {errors.confirmPassword?.message && (
                                    <p className={authCardError}>{errors.confirmPassword.message}</p>
                                )}
                            </div>
                            <Button type="submit" disabled={isPending} className={authCardSubmit}>
                                {isPending ? t('states.loading') : t('auth.resetPassword.submit')}
                            </Button>
                        </form>
                        <Link to="/auth/login" className={authCardLink}>
                            {t('auth.forgotPassword.back')}
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
