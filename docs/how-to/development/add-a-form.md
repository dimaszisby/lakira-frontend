# Add a form

React Hook Form for state, Zod for validation, and a defined path for mapping server-side field
errors back onto inputs.

`src/features/metric-categories/components/MetricCategoryForm.tsx` is the reference implementation.

## 1. Define the schema

Schemas live in the feature's `types.ts`. Compose from the atomic validators in
`src/constants/zod-rules.ts` (all `z`-prefixed: `zUUID`, `zEmail`, `zUsername`, `zISODateTime`, …)
rather than rewriting a regex:

```ts
import { z } from "zod";

import { zUUID } from "@/constants/zod-rules";

export const tagFormSchema = z.object({
  name: z.string().min(1, ZOD_MESSAGES.required).max(60),
  categoryId: zUUID,
});

export type TagFormInput = z.infer<typeof tagFormSchema>;
```

Messages come from `src/constants/zod-messages.ts` — never inline a user-facing string in a schema,
or the same wording drifts across features.

**Infer the type, never hand-write it.** A hand-written type and a schema will disagree eventually,
and TypeScript will believe the wrong one.

## 2. Wire the form

```tsx
const form = useForm<TagFormInput>({
  resolver: zodResolver(tagFormSchema),
  defaultValues: defaults,
  mode: "onTouched",
});
```

Where a schema is a full request envelope, resolve against the body:
`zodResolver(schema.shape.body)`.

Recompute `defaultValues` with `useMemo` and reset on change, the way the reference form does:

```tsx
const defaults = useMemo(() => makeDefaults(initialTag), [initialTag, makeDefaults]);

useEffect(() => {
  form.reset(defaults);
}, [defaults, form]);
```

Without the reset, opening the edit dialog for a second record shows the first record's values.

## 3. Render fields

Use `FormField` — it owns the label, description, and error wiring. `FieldShell` was removed; see
[ADR-0003](../../explanation/decisions/adr-0003-standardize-on-formfield-and-remove-fieldshell.md).

```tsx
<FormField label="Name" error={form.formState.errors.name?.message}>
  <TextField {...form.register("name")} />
</FormField>
```

For inputs that are not plain HTML controls (`ColorField`, `Select`, `DateTimePicker`), wrap in
`Controller`.

## 4. Submit

`@typescript-eslint/no-misused-promises` forbids passing an async function where a sync one is
expected. `handleSubmit` returns a promise, so wrap it:

```tsx
<form
  onSubmit={(event) => {
    void form.handleSubmit(onValid)(event);
  }}
>
```

## 5. Map server errors onto fields

The backend returns field errors as:

```json
{ "status": "fail", "errors": [{ "field": "body.defaultUnit", "message": "Required" }] }
```

Two details that bite: the key is **`field`**, not `path`, and it is dotted and prefixed with the
request part (`body.`), so it has to be trimmed before it will match a form field name.

Put them back on the inputs rather than dumping them in a banner:

```ts
const onValid = async (values: TagFormInput) => {
  try {
    await createTag.mutateAsync(values);
    onClose();
  } catch (error) {
    const normalized = error as NormalizedApiError;
    if (normalized.isAbort) return;

    for (const issue of normalized.raw?.errors ?? []) {
      const field = issue.field.replace(/^body\./, "") as keyof TagFormInput;
      form.setError(field, { message: issue.message });
    }
  }
};
```

Check `isAbort` first. An aborted request is not a failure, and treating it as one paints an error
on a form the user has already navigated away from.

## What Zod is not for

Zod validates **shape and format at a boundary**. It does not enforce business rules that need
server state — uniqueness, quota limits, permissions. Those are the server's answer, and they arrive
as the field errors above.

## Related

- [`../../../.claude/rules/forms-and-validation.md`](../../../.claude/rules/forms-and-validation.md)
- [`../../reference/components/`](../../reference/components/)
