import {createFileRoute, redirect} from '@tanstack/react-router';

export const Route = createFileRoute('/_stackedLayout/')({
    beforeLoad: () => {
        throw redirect({to: '/dashboard'});
    },
});
