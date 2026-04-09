# Forms

## Stack

| Library | Role |
|---------|------|
| **React Hook Form** 7.x | Form state, registration, submission, dirty tracking |
| **Zod** 3.x | Schema definition and validation rules |
| **`useValidatedForm`** (UI library hook) | Wraps `useForm` with Zod resolver integration |
| **`Controller`** (RHF) | Bridge for controlled UI library components |

---

## `useValidatedForm` Hook

The primary form hook. Wraps React Hook Form's `useForm` with Zod schema auto-wiring:

```ts
import {useValidatedForm} from '@ui-lib/hooks/useValidatedForm';

const {
  handleSubmit,
  formState: {errors, isDirty},
  register,
  control,
  setError,
} = useValidatedForm<FormFields>({
  mode: 'onSubmit',      // validate on submit (lazy — no per-keystroke noise)
  schema: zodSchema,     // Zod schema — resolver is auto-configured
  defaultValues: data,   // optional pre-fill for edit mode
});
```

---

## Schema Definition Pattern

Schemas are defined inside a hook (not at module level) to access translated error messages:

```ts
const useSchema = () => {
  const {t} = useTranslation(`${translationKey}.validation`);

  return useMemo(
    () =>
      z.object({
        name: z.string({
          required_error: t('name.error.required'),
        }),
        code: z
          .number({
            required_error: t('code.error.required'),
            invalid_type_error: t('code.error.invalid'),
          })
          .int({message: t('code.error.invalid')})
          .positive({message: t('code.error.positive')}),
        description: z.string().nullish(),
        categoryId: z.string({message: t('category.error.required')}),
        files: z
          .array(z.union([
            z.object({attachmentId: z.string()}),   // existing server file
            z.object({tempPath: z.string()}),        // newly uploaded file
          ]))
          .optional(),
      }),
    [t]
  );
};

// Infer TypeScript type directly from the schema
export type FormFields = z.infer<ReturnType<typeof useSchema>>;
```

---

## Uncontrolled Text Fields (`register`)

For standard text inputs, use `register` directly:

```tsx
<TextField
  {...register('name')}
  label={t('form.field.name.label')}
  placeholder={t('form.field.name.placeholder')}
  invalid={errors.name !== undefined}
  hint={errors.name?.message}
/>
```

Pattern: `invalid` receives a boolean, `hint` receives the error message string.

---

## Controlled Fields (`Controller`)

UI library components that use custom event handlers (e.g., `onValueChange` instead of `onChange`) require `Controller`:

```tsx
import {Controller} from 'react-hook-form';

// Select / dropdown
<Controller
  name="categoryId"
  control={control}
  render={({field}) => (
    <SelectField
      {...field}
      label={t('form.field.category.label')}
      invalid={errors.categoryId !== undefined}
      hint={errors.categoryId?.message}
      value={field.value}
      onValueChange={(value) => field.onChange(value)}
    >
      {options.map(opt => <SelectItem key={opt.value} {...opt} />)}
    </SelectField>
  )}
/>

// Number input
<Controller
  name="code"
  control={control}
  render={({field}) => (
    <NumberField
      {...field}
      invalid={errors.code !== undefined}
      hint={errors.code?.message}
      minValue={1}
      label={t('form.field.code.label')}
      formatOptions={{useGrouping: false, maximumFractionDigits: 0}}
    />
  )}
/>

// Textarea
<Controller
  name="description"
  control={control}
  render={({field}) => (
    <TextAreaField
      {...field}
      height={20}
      label={t('form.field.description.label')}
      placeholder={t('form.field.description.placeholder')}
    />
  )}
/>
```

---

## Form Layout

```tsx
// Full form container
<Form gap={8} onSubmit={submitForm}>

  // Vertical stack of fields
  <FormGroup direction="column">

    // Horizontal row, flex-ratio columns, collapses vertically at 'lg'
    <FormGroup direction="row" columnsFlex={[3, 2]} verticalBreakpoint="lg">

      // No wrap inner row
      <FormGroup direction="row" columnsFlex={[1, 0]} noWrap>
        {/* inputs */}
      </FormGroup>

    </FormGroup>

    // Section with title separator
    <FormGroup direction="column" header={{title: t('form.section.files'), separator: true}}>
      <Uploader files={files} onChange={handleFilesChange} />
    </FormGroup>

  </FormGroup>
</Form>
```

---

## Value Sanitization

Empty strings from optional fields should be converted to `null` before submission:

```ts
const sanitizeFormValues = (values: FormFields): FormFields => ({
  ...values,
  name: values.name === '' ? null : values.name,
  description: values.description === '' ? null : values.description,
});

const submitForm = handleSubmit((values) =>
  onSubmit(sanitizeFormValues(values))
);
```

---

## File Upload

A custom hook manages the file list and builds the API payload:

```ts
import {useFileUpload} from '@/hooks/useFileUpload';

const {files, handleFilesChange, getFilesPayload} = useFileUpload({
  initialFiles: item?.files,   // pre-fill in edit mode
});
```

In the form JSX:
```tsx
<Uploader files={files} onChange={handleFilesChange} />
```

On submit, `getFilesPayload()` returns the correct shape:
- New files → `{tempPath: string}` (pre-uploaded to a temp location)
- Existing files → `{attachmentId: string}` (reference to server attachment)

```ts
onSubmit({
  ...sanitizeFormValues(values),
  files: getFilesPayload(),
});
```

---

## Dirty State Tracking

Parent pages track `isDirty` to enable/disable the submit button and warn before navigation:

```tsx
// In the form component
useEffect(() => {
  onDirtyChange?.(isDirty);
}, [isDirty, onDirtyChange]);

// In the parent page
const [isDirty, setIsDirty] = useState(false);

<FormActions isDirty={isDirty} onSubmit={handleSubmit} submitPermission="entity:create" />
<ItemForm ref={formRef} onDirtyChange={setIsDirty} onSubmit={...} />
```

---

## Ref-Controlled Submission

Parent pages trigger form submission through the ref handle (not a submit button inside the form). See [Component Patterns — Form Component Pattern](./06-component-patterns.md#form-component-pattern-ref-controlled) for the full pattern.

```ts
const formRef = useRef<ItemFormRef>(null);

const handleSubmit = () => formRef.current?.submit();
```

Zod validation runs inside `handleSubmit(onSubmit)` before `onSubmit` is called.

---

## Simple In-Page Form (No Separate Component)

For forms that don't need extraction (e.g., sign-in), everything lives in the page:

```tsx
const {handleSubmit, formState: {errors}, register} = useValidatedForm<Fields>({
  mode: 'onSubmit',
  schema,
});

<Form onSubmit={handleSubmit(handleLogin)}>
  <FormGroup direction="column">
    <TextField
      {...register('username')}
      label="Username"
      invalid={errors.username !== undefined}
      hint={errors.username?.message}
    />
    <TextField
      {...register('password')}
      type="password"
      label="Password"
      invalid={errors.password !== undefined}
      hint={errors.password?.message}
    />
    <Button type="submit" variant="primary" disabled={isPending}>
      Login
    </Button>
  </FormGroup>
</Form>
```
