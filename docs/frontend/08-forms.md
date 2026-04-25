# Forms

## Stack

| Library | Role |
|---------|------|
| **React Hook Form** 7.x | Form state, registration, submission, dirty tracking |
| **Zod** 3.x | Schema definition and validation rules |
| **`@hookform/resolvers/zod`** | Wires Zod schema as RHF resolver |
| **shadcn/ui** `Form` components | Accessible form primitives with error binding |
| **`Controller`** (RHF) | Bridge for controlled shadcn/ui components |

---

## Form Setup

React Hook Form is used directly with the Zod resolver:

```ts
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

const {
  handleSubmit,
  formState: {errors, isDirty},
  register,
  control,
  setError,
} = useForm<FormFields>({
  mode: 'onSubmit',            // validate on submit (lazy — no per-keystroke noise)
  resolver: zodResolver(schema),
  defaultValues: data,         // optional pre-fill for edit mode
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

For standard text inputs, use `register` directly with shadcn/ui `Input` and `Label`:

```tsx
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

<div className="flex flex-col gap-1">
  <Label htmlFor="name">{t('form.field.name.label')}</Label>
  <Input
    id="name"
    {...register('name')}
    placeholder={t('form.field.name.placeholder')}
    aria-invalid={errors.name !== undefined}
  />
  {errors.name && (
    <p className="text-[var(--color-warning)] text-xs">{errors.name.message}</p>
  )}
</div>
```

Use `--color-warning` (not `--color-danger`) for form validation errors.

---

## Controlled Fields (`Controller`)

shadcn/ui components with non-standard event handlers require `Controller`:

```tsx
import {Controller} from 'react-hook-form';
import {Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';

// Select / dropdown
<Controller
  name="categoryId"
  control={control}
  render={({field}) => (
    <div className="flex flex-col gap-1">
      <Label>{t('form.field.category.label')}</Label>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger aria-invalid={errors.categoryId !== undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.categoryId && (
        <p className="text-[var(--color-warning)] text-xs">{errors.categoryId.message}</p>
      )}
    </div>
  )}
/>

// Textarea
<Controller
  name="description"
  control={control}
  render={({field}) => (
    <div className="flex flex-col gap-1">
      <Label>{t('form.field.description.label')}</Label>
      <Textarea
        {...field}
        placeholder={t('form.field.description.placeholder')}
      />
    </div>
  )}
/>
```

---

## Form Layout

Use plain `<form>` with Tailwind flex/grid layout:

```tsx
<form onSubmit={submitForm} className="flex flex-col gap-[var(--gap-elements)]">

  {/* Vertical stack of fields */}
  <div className="flex flex-col gap-[var(--gap-elements)]">

    {/* Horizontal row, collapses to column on small screens */}
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-[var(--gap-elements)]">
      {/* inputs */}
    </div>

    {/* Section with separator */}
    <div className="flex flex-col gap-[var(--gap-elements)]">
      <Separator />
      <p className="text-[var(--color-text-secondary)] text-sm">{t('form.section.files')}</p>
      <Uploader files={files} onChange={handleFilesChange} />
    </div>

  </div>
</form>
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
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

const {handleSubmit, formState: {errors}, register} = useForm<Fields>({
  mode: 'onSubmit',
  resolver: zodResolver(schema),
});

<form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-4">
  <div className="flex flex-col gap-1">
    <Label htmlFor="username">Username</Label>
    <Input id="username" {...register('username')} aria-invalid={!!errors.username} />
    {errors.username && <p className="text-[var(--color-warning)] text-xs">{errors.username.message}</p>}
  </div>
  <div className="flex flex-col gap-1">
    <Label htmlFor="password">Password</Label>
    <Input id="password" type="password" {...register('password')} aria-invalid={!!errors.password} />
    {errors.password && <p className="text-[var(--color-warning)] text-xs">{errors.password.message}</p>}
  </div>
  <Button type="submit" disabled={isPending}>Login</Button>
</form>
```
