import {createFileRoute} from '@tanstack/react-router';
import {LegalDocument} from '@/views/modules/legal/components/LegalDocument';
import {privacyPolicy} from '@/views/modules/legal/content';

export const Route = createFileRoute('/legal/privacy')({
    component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
    return <LegalDocument content={privacyPolicy} />;
}
