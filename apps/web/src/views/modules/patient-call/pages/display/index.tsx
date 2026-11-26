import {useEffect, useRef, useState} from 'react';
import {useGetPatientCallDisplay} from '@agenda-app/client';
import {createFileRoute, useLocation} from '@tanstack/react-router';
import {useTranslation} from 'react-i18next';
import {isApiError} from '@/views/components/QueryErrorHandler';
import {PatientCallDisplay} from '../../components/Display';
import styles from './styles.module.css';

export const Route = createFileRoute('/patient-call')({
    component: DisplayRoute,
});

function DisplayRoute() {
    const token = useLocation({select: (location) => location.hash});

    return <LiveDisplay key={token} token={token} />;
}

function isUnavailable(error: unknown) {
    return isApiError(error) && error.response?.status === 404;
}

function playChime(context: AudioContext) {
    const start = context.currentTime;
    const gain = context.createGain();
    const oscillator = context.createOscillator();

    oscillator.frequency.setValueAtTime(660, start);
    oscillator.frequency.setValueAtTime(880, start + 0.15);
    gain.gain.setValueAtTime(0.18, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.4);

    oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
    };
}

function LiveDisplay({token}: {token: string}) {
    const {t} = useTranslation();
    const validToken = /^[a-f0-9]{64}$/.test(token);
    const display = useGetPatientCallDisplay({
        query: {
            queryKey: ['patient-call-display', token],
            enabled: validToken,
            refetchInterval: (query) => (isUnavailable(query.state.error) ? false : 2000),
            refetchIntervalInBackground: true,
            retry: false,
            throwOnError: false,
            gcTime: 0,
        },
        request: {withCredentials: false, timeout: 4000, headers: {'x-patient-call-token': token}},
    });
    const [expiredAt, setExpiredAt] = useState<string>();
    const [soundReady, setSoundReady] = useState(false);
    const audio = useRef<AudioContext | null>(null);
    const lastSound = useRef<string | null>(null);
    const unavailable = !validToken || isUnavailable(display.error);
    const reconnecting = !unavailable && (display.fetchStatus === 'paused' || display.isError);
    const candidate = display.data?.call;
    const call = !unavailable && !reconnecting && candidate?.expiresAt !== expiredAt ? candidate : null;
    const expiry = call?.expiresAt;
    const soundEnabled = display.data?.soundEnabled ?? false;

    useEffect(() => {
        if (expiry === undefined) return undefined;

        const timer = window.setTimeout(() => setExpiredAt(expiry), Math.max(0, Date.parse(expiry) - Date.now()));

        return () => window.clearTimeout(timer);
    }, [expiry]);

    useEffect(() => {
        if (
            soundEnabled &&
            soundReady &&
            expiry &&
            expiry !== lastSound.current &&
            audio.current?.state === 'running'
        ) {
            lastSound.current = expiry;

            if (Date.parse(expiry) > Date.now()) playChime(audio.current);
        }
    }, [expiry, soundEnabled, soundReady]);

    useEffect(
        () => () => {
            if (audio.current) void audio.current.close();
        },
        []
    );

    async function enableSound() {
        try {
            audio.current ??= new AudioContext();
            await audio.current.resume();
            setSoundReady(audio.current.state === 'running');
        } catch {
            setSoundReady(false);
        }
    }

    let status: string | undefined;

    if (unavailable) status = t('patientCall.unavailable');
    else if (reconnecting) status = t('patientCall.reconnecting');
    else if (display.isPending) status = t('patientCall.connecting');

    return (
        <main className={styles.screen}>
            <PatientCallDisplay
                identity={unavailable ? undefined : display.data}
                logoUrl={unavailable ? null : display.data?.logoUrl}
                call={call}
                recentCalls={unavailable || reconnecting ? [] : display.data?.recentCalls}
                status={status}
                onEnableSound={!unavailable && soundEnabled && !soundReady ? () => void enableSound() : undefined}
            />
        </main>
    );
}
