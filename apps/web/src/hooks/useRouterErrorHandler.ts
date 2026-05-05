import {useCallback} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useLocation, useRouter} from '@tanstack/react-router';
import {useAppStore} from '@/store/appStore';

export const useRouterErrorHandler = () => {
    const location = useLocation();
    const router = useRouter();
    const setAuth = useAppStore((state) => state.setAuth);
    const client = useQueryClient();

    const handleUnauthorizedError = useCallback(() => {
        setAuth(false);
        client.clear();
        throw router.navigate({
            to: '/auth/login',
            search: {redirect: location.pathname},
        });
    }, [client, location.pathname, router, setAuth]);

    return {
        handleUnauthorizedError,
    };
};
