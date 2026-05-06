import {zodResolver} from '@hookform/resolvers/zod';
import type {FieldValues, UseFormProps, UseFormRegister, UseFormReturn} from 'react-hook-form';
import {useForm} from 'react-hook-form';
import useDeepCompareEffect from 'use-deep-compare-effect';
import type {ZodSchema} from 'zod';

type UseValidatedFormProps<T extends FieldValues> = {
    schema: ZodSchema;
} & Omit<UseFormProps<T>, 'resolver'>;

export function useValidatedForm<T extends FieldValues>(props: UseValidatedFormProps<T>): UseFormReturn<T> {
    const {schema, defaultValues, ...rest} = props;

    const {reset, register, ...form} = useForm<T>({
        mode: 'onBlur',
        resolver: zodResolver(schema),
        reValidateMode: 'onBlur',
        defaultValues,
        ...rest,
    });

    useDeepCompareEffect(() => {
        if (isAsyncDefaultValues(defaultValues)) {
            defaultValues()
                .then(reset)
                .catch(() => reset());

            return;
        }

        reset(defaultValues);
    }, [defaultValues, reset]);

    const customRegister: UseFormRegister<T> = (name, options) =>
        register(name, {
            setValueAs: (value: unknown) => (value === '' ? undefined : value),
            ...options,
        });

    return {...form, reset, register: customRegister};
}

function isAsyncDefaultValues<T extends FieldValues>(
    defaultValues: UseFormProps<T>['defaultValues']
): defaultValues is (payload?: unknown) => Promise<T> {
    return typeof defaultValues === 'function';
}
