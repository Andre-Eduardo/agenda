import type {ReactNode} from 'react';
import {Link} from '@tanstack/react-router';
import {useTranslation} from 'react-i18next';
import {css} from '@/styled-system/css';

/** One section of a legal document: a heading and its paragraphs or list items. */
export type LegalSection = {
    title: string;
    paragraphs?: string[];
    items?: string[];
};

export type LegalDocumentContent = {
    title: string;
    /** Version shown to the reader; bump it whenever the text changes. */
    version: string;
    updatedAt: string;
    intro: string;
    sections: LegalSection[];
};

const page = css({minH: 'screen', bg: 'bg.page', color: 'text.primary', px: '4', py: {base: '8', md: '12'}});
const container = css({maxW: '3xl', mx: 'auto', display: 'grid', gap: '6'});
const nav = css({display: 'flex', gap: '4', flexWrap: 'wrap', fontSize: 'sm'});
const navLink = css({color: 'primary', textDecoration: 'underline', textUnderlineOffset: '2px'});
const draftNotice = css({
    borderWidth: '1px',
    borderColor: 'warning',
    bg: 'warning/10',
    rounded: 'md',
    px: '4',
    py: '3',
    fontSize: 'sm',
});
const heading = css({fontSize: '2xl', fontWeight: 'bold'});
const meta = css({fontSize: 'sm', color: 'text.secondary'});
const sectionTitle = css({fontSize: 'lg', fontWeight: 'semibold', mb: '2'});
const paragraph = css({lineHeight: 'relaxed', mb: '2'});
const list = css({listStyleType: 'disc', pl: '6', display: 'grid', gap: '1', lineHeight: 'relaxed'});

function Section({section}: {section: LegalSection}): ReactNode {
    return (
        <section>
            <h2 className={sectionTitle}>{section.title}</h2>
            {section.paragraphs?.map((text) => (
                <p key={text} className={paragraph}>
                    {text}
                </p>
            ))}
            {section.items && (
                <ul className={list}>
                    {section.items.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            )}
        </section>
    );
}

/** Public page for the privacy policy and the terms of use (no login needed). */
export function LegalDocument({content}: {content: LegalDocumentContent}) {
    const {t} = useTranslation();

    return (
        <main className={page}>
            <article className={container}>
                <nav className={nav} aria-label={t('legal.navLabel')}>
                    <Link to="/" className={navLink}>
                        {t('legal.backToApp')}
                    </Link>
                    <Link to="/legal/privacy" className={navLink}>
                        {t('legal.privacy')}
                    </Link>
                    <Link to="/legal/terms" className={navLink}>
                        {t('legal.terms')}
                    </Link>
                </nav>
                <p role="note" className={draftNotice}>
                    {t('legal.draftNotice')}
                </p>
                <header>
                    <h1 className={heading}>{content.title}</h1>
                    <p className={meta}>
                        {t('legal.versionInfo', {version: content.version, date: content.updatedAt})}
                    </p>
                </header>
                <p className={paragraph}>{content.intro}</p>
                {content.sections.map((section) => (
                    <Section key={section.title} section={section} />
                ))}
            </article>
        </main>
    );
}
