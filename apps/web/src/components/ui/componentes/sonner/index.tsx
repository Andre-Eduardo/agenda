import {CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert} from 'lucide-react';
import {useTheme} from 'next-themes';
import {Toaster as Sonner} from 'sonner';
import {cx, css} from '@/styled-system/css';
import {actionButton, cancelButton, description, icon, toast} from './styles';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({...props}: ToasterProps) => {
    const {theme = 'system'} = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster"
            icons={{
                success: <CircleCheck className={icon} />,
                info: <Info className={icon} />,
                warning: <TriangleAlert className={icon} />,
                error: <OctagonX className={icon} />,
                loading: <LoaderCircle className={cx(icon, 'animate-spin')} />,
            }}
            toastOptions={{
                classNames: {
                    toast: cx(toast, 'toast'),
                    description,
                    actionButton,
                    cancelButton,
                },
            }}
            {...props}
        />
    );
};

export {Toaster};
