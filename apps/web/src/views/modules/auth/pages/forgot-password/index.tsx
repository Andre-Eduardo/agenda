import {useMemo, useState} from 'react';
import {useRequestPasswordReset} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {Link, createFileRoute} from '@tanstack/react-router';
import {useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
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

export const Route = createFileRoute('/_auth/auth/forgot-password')({
    component: ForgotPasswordPage,
});

export function ForgotPasswordPage() {
    const {t} = useTranslation();
    const [sent, setSent] = useState(false);

    const schema = useMemo(
        () => z.object({email: z.string().trim().email(t('auth.forgotPassword.validation.email'))}),
        [t]
    );

    type ForgotPasswordData = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        setError,
        formState: {errors},
    } = useForm<ForgotPasswordData>({mode: 'onSubmit', resolver: zodResolver(schema)});

    const {mutate: requestReset, isPending} = useRequestPasswordReset({
        mutation: {
            onSuccess: () => setSent(true),
            onError: (error: {status?: number}) => {
                setError('email', {
                    message:
                        error.status === 429
                            ? t('auth.login.validation.rateLimited')
                            : t('auth.forgotPassword.validation.email'),
                });
            },
        },
    });

    return (
        <div className={authCardRoot}>
            <div className={authCard}>
                <h1 className={authCardTitle}>{t('auth.forgotPassword.title')}</h1>

                {sent ? (
                    <p className={authCardNotice} role="status">
                        {t('auth.forgotPassword.sent')}
                    </p>
                ) : (
                    <>
                        <p className={authCardSubtitle}>{t('auth.forgotPassword.subtitle')}</p>
                        <form
                            onSubmit={handleSubmit((values) => requestReset({data: values}))}
                            className={authCardForm}
                            noValidate
                        >
                            <div>
                                <label htmlFor="forgot-email" className={authCardLabel}>
                                    {t('auth.forgotPassword.email')}
                                </label>
                                <Input
                                    id="forgot-email"
                                    {...register('email')}
                                    type="email"
                                    autoComplete="email"
                                    placeholder="voce@clinica.com.br"
                                />
                                {errors.email?.message && <p className={authCardError}>{errors.email.message}</p>}
                            </div>
                            <Button type="submit" disabled={isPending} className={authCardSubmit}>
                                {isPending ? t('states.loading') : t('auth.forgotPassword.submit')}
                            </Button>
                        </form>
                    </>
                )}

                <Link to="/auth/login" className={authCardLink}>
                    {t('auth.forgotPassword.back')}
                </Link>
            </div>
        </div>
    );
}
