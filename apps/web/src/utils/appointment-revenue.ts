import {
    getGetRevenueReportQueryKey,
    getGetRevenueSummaryQueryKey,
    getSearchAppointmentsQueryKey,
    getSearchOperationalAppointmentsQueryKey,
} from '@agenda-app/client';
import type {QueryClient} from '@tanstack/react-query';

export const REVENUE_AMOUNT_FIELDS = ['expectedBrl', 'receivedBrl', 'pendingBrl'] as const;

export function invalidateAppointmentRevenue(queryClient: QueryClient, clinicId?: string) {
    void queryClient.invalidateQueries({queryKey: getSearchAppointmentsQueryKey()});
    void queryClient.invalidateQueries({queryKey: getSearchOperationalAppointmentsQueryKey()});

    if (clinicId) {
        void queryClient.invalidateQueries({queryKey: getGetRevenueReportQueryKey(clinicId)});
        void queryClient.invalidateQueries({queryKey: getGetRevenueSummaryQueryKey(clinicId)});
    }
}
