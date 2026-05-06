import {renderHook, waitFor} from '@testing-library/react';
import type {RegisterOptions} from 'react-hook-form';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useValidatedForm} from './useValidatedForm';

jest.mock('react-hook-form', () => ({
    useForm: jest.fn(),
}));

jest.mock('use-deep-compare-effect', () => jest.fn((effect: () => void) => effect()));

describe('useValidatedForm', () => {
    const schema = z.object({
        name: z.string().min(1, 'Name is required'),
    });

    const defaultValues = {
        name: '',
    };

    const mockUseFormReturn = {
        reset: jest.fn(),
        register: jest.fn(),
        handleSubmit: jest.fn(),
        formState: {errors: {}},
    };

    beforeEach(() => {
        (useForm as jest.Mock).mockReturnValue(mockUseFormReturn);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize the form with default values and schema resolver', () => {
        renderHook(() => useValidatedForm({schema, defaultValues}));

        expect(useForm).toHaveBeenCalledWith({
            mode: 'onBlur',
            resolver: expect.any(Function),
            reValidateMode: 'onBlur',
            defaultValues,
        });
    });

    it('should initialize the form with async default values', async () => {
        const defaultValuesFunc = () => Promise.resolve(defaultValues);

        renderHook(() => useValidatedForm({schema, defaultValues: defaultValuesFunc}));

        expect(useForm).toHaveBeenCalledWith({
            mode: 'onBlur',
            resolver: expect.any(Function),
            reValidateMode: 'onBlur',
            defaultValues: defaultValuesFunc,
        });

        await waitFor(() => {
            expect(mockUseFormReturn.reset).toHaveBeenCalledWith(defaultValues);
        });
    });

    it('should reset the form when failed to load async default values', async () => {
        const defaultValuesFunc = () => Promise.reject();

        renderHook(() => useValidatedForm({schema, defaultValues: defaultValuesFunc}));

        expect(useForm).toHaveBeenCalledWith({
            mode: 'onBlur',
            resolver: expect.any(Function),
            reValidateMode: 'onBlur',
            defaultValues: defaultValuesFunc,
        });

        await waitFor(() => {
            expect(mockUseFormReturn.reset).toHaveBeenCalledWith();
        });
    });

    it('should reset the form when default values change', () => {
        const {rerender} = renderHook((props) => useValidatedForm(props), {
            initialProps: {schema, defaultValues},
        });

        const newDefaultValues = {name: 'John Doe'};

        rerender({schema, defaultValues: newDefaultValues});

        expect(mockUseFormReturn.reset).toHaveBeenCalledWith(newDefaultValues);
    });

    it('should reset the form when the default values function change', async () => {
        const {rerender} = renderHook((props) => useValidatedForm(props), {
            initialProps: {schema, defaultValues: () => Promise.resolve(defaultValues)},
        });

        const newDefaultValues = {name: 'John Doe'};

        rerender({schema, defaultValues: () => Promise.resolve(newDefaultValues)});

        await waitFor(() => {
            expect(mockUseFormReturn.reset).toHaveBeenCalledWith(newDefaultValues);
        });
    });

    it('should return form methods and reset function', () => {
        const {result} = renderHook(() => useValidatedForm({schema, defaultValues}));

        expect(result.current).toEqual(expect.objectContaining({...mockUseFormReturn, register: expect.any(Function)}));
        expect(result.current.reset).toBe(mockUseFormReturn.reset);
    });

    it.each([
        ['', undefined],
        ['test', 'test'],
        [0, 0],
        [undefined, undefined],
    ])('should transform %p to %p using setValueAs', (input, expected) => {
        const {result} = renderHook(() => useValidatedForm({schema, defaultValues}));

        result.current.register('name');

        const registerCall = mockUseFormReturn.register.mock.calls[0] as [
            'name',
            RegisterOptions<{name: string}, 'name'>,
        ];
        const options = registerCall?.[1];

        const resultValue = options.setValueAs?.(input);

        expect(resultValue).toEqual(expected);
    });
});
