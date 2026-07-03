import {cx} from '@/styled-system/css';
import {
    table,
    tableBody,
    tableCaption,
    tableCell,
    tableFooter,
    tableHead,
    tableHeader,
    tableRow,
    wrapper,
} from './styles';

function Table({className, ref, ...props}: React.ComponentProps<'table'>) {
    return (
        <div className={wrapper}>
            <table ref={ref} className={cx(table, className)} {...props} />
        </div>
    );
}

function TableHeader({className, ref, ...props}: React.ComponentProps<'thead'>) {
    return <thead ref={ref} className={cx(tableHeader, className)} {...props} />;
}

function TableBody({className, ref, ...props}: React.ComponentProps<'tbody'>) {
    return <tbody ref={ref} className={cx(tableBody, className)} {...props} />;
}

function TableFooter({className, ref, ...props}: React.ComponentProps<'tfoot'>) {
    return <tfoot ref={ref} className={cx(tableFooter, className)} {...props} />;
}

function TableRow({className, ref, ...props}: React.ComponentProps<'tr'>) {
    return <tr ref={ref} className={cx(tableRow, className)} {...props} />;
}

function TableHead({className, ref, ...props}: React.ComponentProps<'th'>) {
    return <th ref={ref} className={cx(tableHead, className)} {...props} />;
}

function TableCell({className, ref, ...props}: React.ComponentProps<'td'>) {
    return <td ref={ref} className={cx(tableCell, className)} {...props} />;
}

function TableCaption({className, ref, ...props}: React.ComponentProps<'caption'>) {
    return <caption ref={ref} className={cx(tableCaption, className)} {...props} />;
}

export {Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption};
