import type {PublicPatientCallPanel, PublicPatientCall, RecentPatientCall} from '@agenda-app/client';
import {useTranslation} from 'react-i18next';
import styles from './styles.module.css';

export function PatientCallDisplay({
    identity,
    logoUrl,
    call,
    status,
    recentCalls = [],
    onEnableSound,
}: {
    identity?: Pick<PublicPatientCallPanel, 'foregroundColor' | 'backgroundColor' | 'title' | 'message'>;
    logoUrl?: string | null;
    call?: PublicPatientCall | null;
    status?: string;
    recentCalls?: RecentPatientCall[];
    onEnableSound?: () => void;
}) {
    const {t} = useTranslation();

    return (
        <section
            className={styles.display}
            style={identity && {color: identity.foregroundColor, backgroundColor: identity.backgroundColor}}
        >
            <header className={styles.header}>
                {logoUrl && (
                    <img
                        className={styles.logo}
                        src={logoUrl}
                        alt={t('patientCall.logo')}
                        referrerPolicy="no-referrer"
                    />
                )}
                <h1 className={styles.title}>{identity?.title ?? t('patientCall.panelTitle')}</h1>
                {onEnableSound && (
                    <button type="button" className={styles.sound} onClick={onEnableSound}>
                        {t('patientCall.enableSound')}
                    </button>
                )}
            </header>
            <div className={styles.board} aria-live="polite" aria-atomic="true">
                {call ? (
                    <>
                        <p className={styles.name}>{call.patientName}</p>
                        <p className={styles.destination}>{call.destination}</p>
                    </>
                ) : (
                    <p className={styles.destination}>{status ?? t('patientCall.waitingDisplay')}</p>
                )}
            </div>
            {call && identity && <p className={styles.instructions}>{identity.message}</p>}
            {recentCalls.length > 0 && (
                <section className={styles.recent}>
                    <h2 className={styles.recentTitle}>{t('patientCall.recentCalls')}</h2>
                    <ol className={styles.recentList}>
                        {recentCalls.map(({patientName, destination}, index) => (
                            <li className={styles.recentRow} key={`${patientName}-${destination}-${index}`}>
                                <strong>{patientName}</strong>
                                <span>{destination}</span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </section>
    );
}
