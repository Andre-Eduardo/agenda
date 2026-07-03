import {useEffect} from 'react';
import {useQueryErrorResetBoundary} from '@tanstack/react-query';
import {AlertTriangle, ShieldOff} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/componentes/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/componentes/card';
import {useRouterErrorHandler} from '@/hooks/useRouterErrorHandler';
import {isForbiddenError, isUnauthorizedError} from '@/views/components/QueryErrorHandler';
import * as styles from './styles';

interface ErrorPageProps {
    error?: Error;
    reset?: () => void;
}

export function ErrorPage({error, reset}: ErrorPageProps) {
    const {t} = useTranslation();
    const {handleUnauthorizedError} = useRouterErrorHandler();
    const queryErrorResetBoundary = useQueryErrorResetBoundary();
    const isForbidden = isForbiddenError(error);

    useEffect(() => {
        queryErrorResetBoundary.reset();
    }, [queryErrorResetBoundary]);

    useEffect(() => {
        if (isUnauthorizedError(error)) {
            handleUnauthorizedError();
        }
    }, [error, handleUnauthorizedError]);

    if (isForbidden) {
        return (
            <div className={styles.container}>
                <Card className={styles.card}>
                    <CardHeader className={styles.cardHeader}>
                        <div className={styles.iconWrapper}>
                            <ShieldOff aria-hidden className={styles.icon} />
                        </div>
                        <CardTitle className={styles.title}>{t('states.forbidden')}</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                        <AlertTriangle aria-hidden className={styles.icon} />
                    </div>
                    <CardTitle className={styles.title}>{t('states.error')}</CardTitle>
                    {error?.message && (
                        <CardDescription className={styles.description}>{error.message}</CardDescription>
                    )}
                </CardHeader>
                {reset && (
                    <CardContent className={styles.cardContent}>
                        <Button type="button" onClick={reset}>
                            {t('actions.confirm')}
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
