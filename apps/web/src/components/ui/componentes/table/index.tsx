import {clsx} from 'clsx';

import styles from './table.module.css';

function Table({className, ref, ...props}: React.ComponentProps<'table'>) {
  return (
    <div className={styles.wrapper}>
      <table ref={ref} className={clsx(styles.table, className)} {...props} />
    </div>
  );
}

function TableHeader({className, ref, ...props}: React.ComponentProps<'thead'>) {
  return <thead ref={ref} className={clsx(styles.tableHeader, className)} {...props} />;
}

function TableBody({className, ref, ...props}: React.ComponentProps<'tbody'>) {
  return <tbody ref={ref} className={clsx(styles.tableBody, className)} {...props} />;
}

function TableFooter({className, ref, ...props}: React.ComponentProps<'tfoot'>) {
  return <tfoot ref={ref} className={clsx(styles.tableFooter, className)} {...props} />;
}

function TableRow({className, ref, ...props}: React.ComponentProps<'tr'>) {
  return <tr ref={ref} className={clsx(styles.tableRow, className)} {...props} />;
}

function TableHead({className, ref, ...props}: React.ComponentProps<'th'>) {
  return <th ref={ref} className={clsx(styles.tableHead, className)} {...props} />;
}

function TableCell({className, ref, ...props}: React.ComponentProps<'td'>) {
  return <td ref={ref} className={clsx(styles.tableCell, className)} {...props} />;
}

function TableCaption({className, ref, ...props}: React.ComponentProps<'caption'>) {
  return <caption ref={ref} className={clsx(styles.tableCaption, className)} {...props} />;
}

export {Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption};
