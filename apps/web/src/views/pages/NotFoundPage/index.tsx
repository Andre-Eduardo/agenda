import {Link} from '@tanstack/react-router';
import {Compass} from 'lucide-react';
import {Button} from '@/components/ui/componentes/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/componentes/card';
import * as styles from './styles';

export function NotFoundPage() {
    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                        <Compass aria-hidden className={styles.icon} />
                    </div>
                    <CardTitle className={styles.title}>404</CardTitle>
                    <CardDescription className={styles.description}>Página não encontrada</CardDescription>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                    <Button asChild>
                        <Link to="/">Voltar para o início</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
