import {Outlet, createFileRoute, redirect} from '@tanstack/react-router';
import {css} from '@/styled-system/css';

export const Route = createFileRoute('/_auth')({
    beforeLoad: ({context}) => {
        if (context?.auth) {
            throw redirect({to: '/'});
        }
    },
    component: AuthLayout,
});

export function AuthLayout() {
    return (
        <div className={css({minH: 'screen'})}>
            <Outlet />
        </div>
    );
}
