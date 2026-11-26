import {createFileRoute} from '@tanstack/react-router';
import {LegalDocument} from '@/views/modules/legal/components/LegalDocument';
import {termsOfUse} from '@/views/modules/legal/content';

export const Route = createFileRoute('/legal/terms')({
    component: TermsOfUsePage,
});

function TermsOfUsePage() {
    return <LegalDocument content={termsOfUse} />;
}
